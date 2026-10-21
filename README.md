# Лабораторная работа 3 Типы грунта

Давыдов Кирилл Игоревич, ИУ5-54Б. Вариант 20 — определение объёма земляных работ при разработке котлована.

NestJS 11, TypeORM 1.1, PostgreSQL 12, MinIO, Handlebars.

## Запуск

```bash
docker compose -p backend up -d
npm ci
# Создать .env по .env.example, если .env ещё нет.
npm run migration:run
npm run start:dev
```

Переменные `.env`: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.

Перед загрузкой файлов создать в MinIO Console (`http://localhost:9001`) bucket `soil-types` с чтением объектов; параметры локального стенда — в `.env.example`.

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
| 9 | POST | `/api/users/login` | нет — заглушка до ЛР4 | 200: текущий пользователь |
| 10 | POST | `/api/users/logout` | нет — заглушка до ЛР4 | 204: без тела |

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

До ЛР4 текущий пользователь — константа 1 в `getCurrentUserId()`. Регистрация без полноценного входа, login/logout — заглушки.

## Материалы для защиты

Диаграммы ER, классов и последовательности находятся в одном файле [docs/soil_types.mdj](docs/soil_types.mdj). Коллекция Postman и файлы для form-data — в [postman/](postman/).

Отчёт ЛР3 и исправления замечаний — в [docs/reports/](docs/reports/).
