# Лабораторная работа 4 Типы грунта

Давыдов Кирилл Игоревич, ИУ5-54Б. Вариант 20 — определение объёма земляных работ при разработке котлована.

NestJS 11, TypeORM 1.1, PostgreSQL 12, MinIO, Handlebars, Redis 6.2, Swagger.

## Запуск

```bash
docker compose -p backend up -d
npm ci
# Создать .env по .env.example, если .env ещё нет.
npm run migration:run
docker exec -i backend-db-1 psql -U root -d RIP < src/migrations/seed.sql
npm run start:dev
```

`seed.sql` очищает учебные таблицы. Выполнять только для подготовки исходных данных. Пароли в seed хешированы: `user1 / pass1`, `user2 / pass2` (модератор), `user3 / pass3`. После изменения старой базы миграция хеширует существующие пароли. Вход не меняет их значения.

Swagger: http://localhost:3000/api, схема: `/api-json`. Браузер получает HttpOnly cookie при входе и отправляет её автоматически; вручную вставить cookie в Swagger из JavaScript нельзя. Для Postman перенести `sessionId` из Application → Cookies в заголовок `Cookie: sessionId=...`.

Настройки локального Docker-стенда приведены в `.env.example`. В MinIO Console (`http://localhost:9001`, локальные данные входа из compose) создать bucket `soil-types`, разрешить чтение объектов и загрузить учебные фото/видео из ЛР1.

Переменные `.env`: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`. Redis: `REDIS_HOST` (localhost), `REDIS_PORT` (6379), `REDIS_PASSWORD` (локальное значение из compose). `PORT` — 3000 по умолчанию. `NODE_ENV=production` включает Secure для cookie и требует HTTPS.

## Ровно 10 методов API

У ленты один адрес `/api/soil_types/feed`. Без id возвращается первый грунт, с `?id=8&next=true` — следующий после указанного. Это один метод с разными параметрами.

| № | Метод | URL | Входные поля | Ответ |
|---|---|---|---|---|
| 1 | GET | `/api/soil_types` | query: maxLoosening — необязательное число | 200: массив опубликованных; isMine — 0/1 |
| 2 | GET | `/api/soil_types/feed` | query: id — необязательный id; next=true — следующий по кругу | 200: один опубликованный грунт; isLiked — 0/1; 404 — не найден |
| 3 | GET | `/api/soil_types/draft` | нет; пользователь определяется сервером | 200: поля своего черновика; 404 — нет черновика |
| 4 | POST | `/api/soil_types` | multipart/form-data: name (обязательно), image (файл), video (файл) | 201: {"id": 8}; 400 — второй черновик |
| 5 | PUT | `/api/soil_types/{id}/publish` | path: id; JSON: description, looseningFactor, density | 200: опубликованный грунт; 404 — свой черновик не найден |
| 6 | DELETE | `/api/soil_types/{id}` | path: id | 204: удалён логически; 403 — чужой; 404 — отсутствует |
| 7 | POST | `/api/soil_types/{id}/like` | path: id; JSON: value (0 или 1) | 201: грунт с likesCount и isLiked |
| 8 | POST | `/api/users/register` | JSON: login, password | 201: id, login, isModerator; 400 — логин занят |
| 9 | POST | `/api/users/login` | JSON: login, password | 200: id, login, isModerator; cookie sessionId (ЛР4) |
| 10 | POST | `/api/users/logout` | cookie sessionId (ЛР4) | 204: сессия удалена (ЛР4) |

## Какие поля отправляет клиент

«Далее» — ровно 3 поля: **name, image, video**. Обязательно только name. В Postman: Body → form-data, у image/video тип File. Ответ создания содержит только id; это выход, а не дополнительное входное поле.

«Опубликовать» — ровно 3 поля JSON: **description, looseningFactor, density**. id берётся из адреса. Служебные status, creatorId, createdAt, formedAt вычисляются на сервере и с клиента не принимаются (400). При публикации все три пользовательских поля обязательны, хотя в БД они могут быть NULL у черновика.

```json
{"description":"Крупнообломочный грунт", "looseningFactor":1.18, "density":1.95}
```

GET черновика возвращает поля для заполнения формы: id, name, imageUrl, videoUrl, description, looseningFactor, density; также вычисленные likesCount, isLiked, isMine. Они не становятся полями запроса «Далее».

Ответ карточки: id, name, description, imageUrl, videoUrl, looseningFactor, density, likesCount, isLiked, isMine. Системные поля скрыты. Числа NUMERIC преобразуются в number; отсутствующие медиа возвращаются как null.

## Таблицы и все их поля

В БД ровно 3 таблицы предметной области. Техническая таблица migrations ведётся TypeORM. Каскадное удаление запрещено: все внешние ключи ON DELETE NO ACTION.

### soil_types

| Поле | Тип | NULL | Назначение |
|---|---|---|---|
| id | SERIAL | нет | PK, генерируется БД |
| name | VARCHAR(100) | нет | Название типа грунта |
| description | VARCHAR(1000) | да | Описание; заполняется при публикации |
| status | VARCHAR(20) | нет | draft / published / deleted; сервер |
| imageUrl | VARCHAR(255) | нет | URL фото MinIO; пустая строка — заглушка |
| videoUrl | VARCHAR(255) | нет | URL видео MinIO; пустая строка — заглушка |
| looseningFactor | NUMERIC(4,2) | да | Коэффициент разрыхления, при публикации 1–2 |
| density | NUMERIC(4,2) | да | Плотность т/м³, при публикации 0,5–3 |
| createdAt | TIMESTAMP | нет | БД: момент создания |
| formedAt | TIMESTAMP | да | БД: момент публикации |
| creatorId | INTEGER | нет | FK → users.id, сервер |

### users

| Поле | Тип | NULL | Назначение |
|---|---|---|---|
| id | SERIAL | нет | PK |
| login | VARCHAR(50) | нет | Логин; уникальный в ЛР4 |
| password | VARCHAR(100) | нет | В ЛР4 хеш bcrypt; в ответы не входит |
| isModerator | BOOLEAN | нет | Признак модератора; по умолчанию false |

### likes

| Поле | Тип | NULL | Назначение |
|---|---|---|---|
| id | SERIAL | нет | PK |
| userId | INTEGER | нет | FK → users.id |
| soilTypeId | INTEGER | нет | FK → soil_types.id |

У soil_types ровно четыре nullable-поля: description, looseningFactor, density, formedAt. Ссылка на создателя обязательна. Пустые URL заменяются в HTML на файлы из public.

## Правила работы

- Не больше одного черновика на пользователя.
- Публикация меняет свой черновик на published и заполняет formedAt из времени БД.
- Удаление меняет статус на deleted; опубликованные и черновики других пользователей удалить нельзя.
- Удалённые записи не возвращаются в каталоге и ленте.
- Следующий грунт выбирается одним запросом с LIMIT 1, пропуски id допустимы.
- Повторный лайк не создаёт ещё одну строку; value=0 снимает лайк.

## Авторизация

Каталог и лента доступны гостю; isMine/isLiked у гостя равны 0. Собственный черновик, создание, публикация, лайки и удаление требуют действующей сессии (иначе 401). Создатель берётся из пользователя сессии, не из тела запроса. Модератор не получает права удалять чужие грунты: текущие правила для карточек одинаковы для всех зарегистрированных пользователей.

Сессия: случайные 32 байта → cookie sessionId → ключ Redis session:<id> → userId. TTL 3600 секунд с момента входа. Cookie: HttpOnly, SameSite=Lax, Path=/; Secure при HTTPS в production. Повторный вход заменяет предыдущую cookie и удаляет её старый ключ; выход удаляет ключ и очищает cookie. Несколько разных браузеров имеют независимые сессии. Пароли хешируются bcrypt, число раундов 12.

```bash
docker exec backend-redis-1 redis-cli -a password --no-auth-warning --scan --pattern 'session:*'
docker exec backend-redis-1 redis-cli -a password --no-auth-warning GET session:<id>
docker exec backend-redis-1 redis-cli -a password --no-auth-warning TTL session:<id>
```

Проверки выполнялись на отдельной БД `rip_lab4_20261017`, порт 3004. Для обычного запуска используется DB_DATABASE из .env и порт 3000. Служебные страницы SSR в Swagger скрыты; `/users/login` — форма входа, `/soil_types` — каталог, `/soil_types/feed` — лента, `/soil_types/draft` — добавление. POST-формы используют ту же проверку сессии, что API.

## Материалы для защиты

Диаграммы ER, классов и последовательности находятся в одном файле [docs/soil_types.mdj](docs/soil_types.mdj). Коллекция Postman и файлы для form-data — в [postman/](postman/).

ТЗ, РПЗ, отчёты ЛР3–4 и исправления замечаний ЛР3 — в [docs/reports/](docs/reports/). Проверка 20.10.2026: сборка, три миграции на новой БД `rip_audit_20261020`, 38 сценариев API, 10 операций Swagger. Протокол — [docs/validation.md](docs/validation.md).
