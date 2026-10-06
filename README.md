# ЛР 3. Веб-сервис. NestJS/TypeORM/PostgreSQL/MinIO

**Давыдов Кирилл Игоревич, ИУ5-54Б**

## Содержание

- [Цель работы](#цель-работы)
- [Тема](#тема)
- [Запуск](#запуск)
- [HTTP-методы](#http-методы)
- [Таблицы базы данных](#таблицы-базы-данных)
- [Правила](#правила)
- [Задание](#задание)

## Цель работы

Создание веб-сервиса в бэкенде системы для использования его в SPA.

## Тема

Определение объёма земляных работ при разработке котлована. Услуги — типы
грунтов, у каждого два поля по теме: коэффициент разрыхления и плотность.

## Запуск

```bash
docker compose up -d
npm install
npm run migration:run
docker exec -i backend-db-1 psql -U root -d RIP < src/migrations/seed.sql
npm run start:dev
```

Переменные в `.env`: `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`,
`DB_DATABASE`, `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_USE_SSL`,
`MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY`, `MINIO_BUCKET`.

## HTTP-методы

Все адреса веб-сервиса начинаются с `/api`. Текущий пользователь зафиксирован
функцией `getCurrentUserId()` в `src/current-user.ts`.

### Типы грунта — `/api/soil_types`

| Метод | Адрес | Что делает | Тело |
|-------|-------|------------|------|
| GET | `/api/soil_types?maxLoosening=1.2` | список опубликованных, фильтр «коэффициент разрыхления не более», в каждой записи `isMine` 0/1 | — |
| GET | `/api/soil_types/feed` | первый опубликованный тип грунта для ленты, `isLiked` 0/1 — лайкнул ли его текущий пользователь | — |
| GET | `/api/soil_types/feed/:id?next=true` | тип грунта по id, с `next=true` — следующий за ним, по кругу; тоже с `isLiked` | — |
| GET | `/api/soil_types/draft` | черновик текущего пользователя | — |
| POST | `/api/soil_types` | создать черновик, фото и видео сохраняются в MinIO | form-data: `name`, `image`, `video` |
| PUT | `/api/soil_types/:id/publish` | опубликовать черновик | JSON: `description`, `looseningFactor`, `density` |
| DELETE | `/api/soil_types/:id` | логическое удаление, только своих | — |
| POST | `/api/soil_types/:id/like` | поставить (1) или снять (0) лайк | JSON: `value` |

Пример ответа:

```json
{
  "id": 1,
  "name": "Песок",
  "description": "Рыхлый несвязный грунт из зёрен размером 0,05–2 мм…",
  "imageUrl": "http://localhost:9000/soil-types/sand.jpg",
  "videoUrl": "http://localhost:9000/soil-types/sand.mp4",
  "looseningFactor": 1.12,
  "density": 1.65,
  "likesCount": 12,
  "isLiked": 1,
  "isMine": 1
}
```

### Пользователи — `/api/users`

| Метод | Адрес | Что делает | Тело |
|-------|-------|------------|------|
| POST | `/api/users/register` | регистрация | JSON: `login`, `password` |
| POST | `/api/users/login` | заглушка до ЛР4, возвращает текущего пользователя | — |
| POST | `/api/users/logout` | заглушка до ЛР4 | — |

Страницы из ЛР1–2 (`/soil_types`, `/soil_types/feed`, `/soil_types/draft`)
остались и работают через тот же сервис.

## Таблицы базы данных

### soil_types — типы грунта

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL, PK | идентификатор |
| name | VARCHAR(100) | название |
| description | VARCHAR(1000) | описание, заполняется при публикации |
| status | VARCHAR(20) | `draft`, `published` или `deleted` |
| imageUrl | VARCHAR(255) | адрес фото в MinIO |
| videoUrl | VARCHAR(255) | адрес видео в MinIO |
| looseningFactor | NUMERIC(4,2), NULL | коэффициент разрыхления |
| density | NUMERIC(4,2), NULL | плотность, т/м³ |
| createdAt | TIMESTAMP | дата создания |
| formedAt | TIMESTAMP, NULL | дата публикации |
| creatorId | INTEGER, FK → users.id | создатель |

### users — пользователи

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL, PK | идентификатор |
| login | VARCHAR(50) | логин |
| password | VARCHAR(100) | пароль |
| isModerator | BOOLEAN | признак модератора |

### likes — лайки, связь многие-ко-многим

| Поле | Тип | Описание |
|------|-----|----------|
| id | SERIAL, PK | идентификатор |
| userId | INTEGER, FK → users.id | кто поставил |
| soilTypeId | INTEGER, FK → soil_types.id | какому типу грунта |

Каскадное удаление запрещено: у всех внешних ключей `ON DELETE NO ACTION`.

## Правила

- Удалённые записи клиенту не передаются.
- У пользователя не больше одного черновика: второй `POST` вернёт 400.
- Статус меняется только вперёд: черновик → опубликован (`PUT publish`),
  опубликован → удалён (`DELETE`). Вернуть в черновик нельзя.
- Системные поля (`id`, `status`, `creatorId`, `createdAt`, `formedAt`) с
  клиента не принимаются: лишнее поле в теле запроса вернёт 400.
- Удалять можно только свои типы грунта, иначе 403.
- Имена файлов в MinIO генерируются на латинице:
  `soil-type-image-<время>.jpg`, `soil-type-video-<время>.mp4`.

## Задание

Создание веб-сервиса со всей итоговой бизнес-логикой (кроме авторизации),
подключение его к БД и тестирование в Postman. Методы и адреса соответствуют
REST, работа с БД через ORM, фото и видео услуг хранятся в MinIO.
