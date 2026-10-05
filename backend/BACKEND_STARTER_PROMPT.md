# Production-Ready Node.js Backend Starter Kit

Her yeni backend projemde temel olarak kullanabileceğim, modüler, ölçeklenebilir, güvenli ve production-ready bir backend starter kit geliştir.

Bu proje yalnızca örnek bir demo uygulama olmamalıdır. Yeni projelerde doğrudan fork edilerek veya template repository olarak kullanılabilecek gerçek bir başlangıç altyapısı olmalıdır.

## 1. Temel teknoloji yığını

Aşağıdaki teknoloji yığınını kullan:

* Node.js 24 LTS
* TypeScript
* Express.js
* PostgreSQL
* Drizzle ORM
* Redis
* BullMQ
* Docker ve Docker Compose
* Nginx reverse proxy örneği
* npm
* ESLint
* Prettier
* Husky
* lint-staged
* Jest veya Vitest
* Supertest
* Zod
* Swagger / OpenAPI
* PM2 production ecosystem dosyası

Mümkün olduğunca güncel, kararlı ve production ortamında yaygın kullanılan paketleri tercih et.

Deneysel, terk edilmiş veya bakımı yapılmayan paketleri kullanma.

---

## 2. Mimari yaklaşım

Projeyi aşağıdaki prensiplere uygun geliştir:

* Clean Architecture
* Modular Monolith
* Domain-driven modüler yapı
* SOLID
* Dependency Inversion
* Separation of Concerns
* Repository Pattern
* Service Layer
* Controller Layer
* DTO ve validation ayrımı
* Merkezi hata yönetimi
* Test edilebilirlik
* Framework bağımlılığını sınırlama

Aşırı soyutlama yapma.

Her interface için gereksiz interface oluşturma. Yalnızca gerçekten bağımlılık değişimi, test edilebilirlik veya altyapı izolasyonu gereken noktalarda abstraction kullan.

Business logic controller içerisinde bulunmamalıdır.

Controller yalnızca:

1. Request verisini almalı
2. Validation sonucunu kullanmalı
3. İlgili use-case veya service katmanını çağırmalı
4. Standart response dönmelidir

---

## 3. Önerilen klasör yapısı

Aşağıdaki yapıya yakın bir organizasyon oluştur:

```text
src/
├── app.ts
├── server.ts
├── config/
│   ├── env.ts
│   ├── database.ts
│   ├── redis.ts
│   ├── logger.ts
│   └── observability.ts
├── common/
│   ├── errors/
│   ├── middleware/
│   ├── guards/
│   ├── decorators/
│   ├── validators/
│   ├── utils/
│   ├── constants/
│   ├── types/
│   └── responses/
├── infrastructure/
│   ├── database/
│   ├── cache/
│   ├── queue/
│   ├── mail/
│   ├── storage/
│   ├── observability/
│   └── providers/
├── modules/
│   ├── auth/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── repositories/
│   │   ├── routes/
│   │   ├── validators/
│   │   ├── dto/
│   │   ├── types/
│   │   └── tests/
│   ├── users/
│   ├── sessions/
│   ├── roles/
│   ├── permissions/
│   ├── notifications/
│   ├── audit-logs/
│   ├── health/
│   └── files/
├── jobs/
├── events/
├── routes/
└── tests/
```

Gerekli gördüğün yerde yapıyı iyileştirebilirsin ancak modüller birbirinden izole olmalıdır.

Bir modül, başka bir modülün iç klasörlerine doğrudan erişmemelidir.

---

## 4. Environment yönetimi

Tüm environment değişkenlerini Zod ile doğrula.

Uygulama, zorunlu bir environment değişkeni eksikse başlangıç aşamasında açık bir hata ile kapanmalıdır.

Şunları hazırla:

* `.env.example`
* development
* test
* staging
* production ayrımı
* güvenli default değerler
* environment değişkenlerinin merkezi erişimi
* secret değerlerin loglara yazılmasını engelleyen mekanizma

Aşağıdaki başlıklarda environment değişkenleri oluştur:

```env
NODE_ENV=
PORT=
APP_NAME=
APP_URL=
API_PREFIX=
API_VERSION=

DATABASE_URL=
REDIS_URL=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=
JWT_ACCESS_EXPIRES_IN=
JWT_REFRESH_EXPIRES_IN=

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
APPLE_CALLBACK_URL=

SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

SENTRY_DSN=
SENTRY_ENVIRONMENT=
SENTRY_RELEASE=

POSTHOG_API_KEY=
POSTHOG_HOST=

LOKI_HOST=
LOKI_BASIC_AUTH_USER=
LOKI_TOKEN=

AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

RATE_LIMIT_WINDOW_MS=
RATE_LIMIT_MAX_REQUESTS=

CORS_ORIGINS=
COOKIE_DOMAIN=
ENCRYPTION_KEY=
```

---

## 5. Authentication sistemi

Eksiksiz bir authentication altyapısı oluştur.

### Desteklenecek yöntemler

* E-posta ve şifre ile kayıt
* E-posta ve şifre ile giriş
* Google OAuth
* Apple Sign In
* Access token
* Refresh token
* Token rotation
* Refresh token reuse detection
* E-posta doğrulama
* Şifre sıfırlama
* Şifre değiştirme
* Tüm cihazlardan çıkış
* Mevcut cihazdan çıkış
* Aktif oturumları listeleme
* Belirli bir oturumu sonlandırma
* Hesap silme
* Hesabı geçici olarak pasifleştirme
* OAuth hesabını mevcut kullanıcıyla bağlama
* OAuth hesabının bağlantısını kaldırma

OAuth sisteminde sadece provider e-postasına güvenerek kullanıcıları otomatik birleştirme.

Hesap birleştirme işlemlerinde güvenli doğrulama mekanizması kullan.

Google veya Apple tarafından dönen e-posta adresi doğrulanmış değilse buna göre işlem yap.

### Token güvenliği

* Access token kısa ömürlü olmalı
* Refresh token uzun ömürlü olmalı
* Refresh token veritabanında düz metin tutulmamalı
* Refresh token hash olarak saklanmalı
* Refresh token rotation uygulanmalı
* Token ailesi veya session ailesi takip edilmeli
* Çalınmış refresh token tekrar kullanılırsa ilgili token ailesi iptal edilmeli
* JWT içerisinde gereksiz kullanıcı bilgisi bulunmamalı
* Token doğrulamasında issuer ve audience kontrol edilmeli
* Secret rotation yapılabilecek şekilde tasarlanmalı

Web istemcileri için refresh token’ı:

* HttpOnly
* Secure
* SameSite ayarlı cookie

üzerinden destekle.

Mobil istemciler için refresh token response desteği opsiyonel olarak bulunabilir ancak kullanım şekli açıkça dokümante edilmelidir.

---

## 6. Kullanıcı ve authentication veritabanı modeli

Drizzle migration’ları ile en az aşağıdaki tabloları oluştur:

### users

* id
* email
* normalizedEmail
* passwordHash
* firstName
* lastName
* displayName
* avatarUrl
* phoneNumber
* emailVerifiedAt
* phoneVerifiedAt
* status
* locale
* timezone
* lastLoginAt
* lastLoginIp
* createdAt
* updatedAt
* deletedAt

### auth_accounts

OAuth sağlayıcılarını takip etmek için:

* id
* userId
* provider
* providerAccountId
* providerEmail
* providerEmailVerified
* accessTokenEncrypted
* refreshTokenEncrypted
* tokenExpiresAt
* scope
* createdAt
* updatedAt

`provider + providerAccountId` alanları unique olmalıdır.

### sessions

* id
* userId
* tokenFamilyId
* refreshTokenHash
* deviceId
* deviceName
* platform
* userAgent
* ipAddress
* lastUsedAt
* expiresAt
* revokedAt
* revokeReason
* replacedBySessionId
* createdAt
* updatedAt

### email_verification_tokens

* id
* userId
* tokenHash
* expiresAt
* usedAt
* createdAt

### password_reset_tokens

* id
* userId
* tokenHash
* expiresAt
* usedAt
* createdAt

### roles

* id
* name
* slug
* description
* createdAt
* updatedAt

### permissions

* id
* name
* slug
* description
* createdAt
* updatedAt

### user_roles

* userId
* roleId

### role_permissions

* roleId
* permissionId

### audit_logs

* id
* actorUserId
* action
* entityType
* entityId
* oldValues
* newValues
* metadata
* ipAddress
* userAgent
* requestId
* createdAt

Soft delete kullanılan tablolarda sorguların yanlışlıkla silinmiş kayıtları döndürmesini engelle.

Gerekli index, foreign key, unique constraint ve cascade davranışlarını açıkça tanımla.

---

## 7. Authorization

RBAC altyapısı oluştur:

* Kullanıcı
* Rol
* Yetki
* Kullanıcı-rol ilişkisi
* Rol-yetki ilişkisi

Örnek roller:

* super-admin
* admin
* user

Örnek yetkiler:

* users.read
* users.create
* users.update
* users.delete
* roles.manage
* audit-logs.read

Route seviyesinde kullanılabilecek middleware veya guard yapısı oluştur:

```ts
requireAuth()
requireRole('admin')
requirePermission('users.read')
```

Authorization yalnızca frontend kontrolüne bırakılmamalıdır.

---

## 8. Güvenlik

Aşağıdaki güvenlik önlemlerini uygula:

* Helmet
* CORS allowlist
* Rate limiting
* Login endpoint rate limit
* Forgot-password endpoint rate limit
* OAuth state doğrulaması
* PKCE desteği gereken akışlarda PKCE
* CSRF koruması
* Request body size limit
* Parameter pollution koruması
* Güvenli cookie ayarları
* Argon2id şifre hashleme
* Minimum şifre politikası
* Brute-force koruması
* Geçici hesap kilitleme
* Hassas verilerin loglardan maskelenmesi
* SQL injection koruması
* Mass assignment riskine karşı DTO kullanımı
* Open redirect koruması
* Güvenli HTTP header’ları
* Request timeout
* Graceful shutdown
* Dependency vulnerability kontrolü

Şifrelerde bcrypt yerine mümkünse Argon2id kullan.

OAuth token’ları saklanacaksa AES-256-GCM gibi authenticated encryption yöntemiyle şifrele.

Encryption key kullanımını merkezi bir servis üzerinden gerçekleştir.

---

## 9. Observability

Observability altyapısını ayrı ve değiştirilebilir provider’lar halinde tasarla.

### Logging

Pino kullan.

Loglar JSON formatında olmalı.

Her request için:

* requestId
* correlationId
* method
* path
* statusCode
* duration
* userId
* ipAddress
* userAgent

alanlarını mümkün olduğunca ekle.

Aşağıdaki alanları maskele:

* password
* passwordConfirmation
* accessToken
* refreshToken
* authorization
* cookie
* clientSecret
* privateKey

Development ortamında okunabilir log formatı kullanılabilir.

### Sentry

Aşağıdakileri entegre et:

* Exception tracking
* Unhandled rejection
* Uncaught exception
* Express error middleware
* Release bilgisi
* Environment bilgisi
* Request context
* User context
* Performance tracing
* Sampling configuration

Kişisel veya hassas kullanıcı verilerini Sentry’ye göndermeden önce temizle.

### Loki

Pino loglarının Loki’ye gönderilebilmesi için altyapı oluştur.

Ancak Loki erişilemediğinde uygulama çökmemeli.

Loglar öncelikle stdout’a yazılmalı.

Production ortamında stdout loglarının Promtail veya Grafana Alloy ile toplanabileceği önerilen yapı için örnek konfigürasyon sağla.

Uygulamanın Loki’ye doğrudan bağlanması ile stdout collector yaklaşımını karşılaştır ve production için daha güvenli olan yöntemi varsayılan yap.

### PostHog

Backend event tracking altyapısı oluştur.

Örnek event’ler:

* user_registered
* user_logged_in
* user_logged_out
* email_verified
* password_reset_requested
* password_reset_completed
* oauth_account_connected
* oauth_account_disconnected
* account_deleted

Analytics event gönderimi business transaction’ı engellememeli.

PostHog erişilemezse ana işlem başarısız olmamalıdır.

Kullanıcıların analytics opt-out seçeneğini destekle.

### Metrics

Prometheus uyumlu `/metrics` endpoint’i ekle.

Örnek metrikler:

* HTTP request count
* HTTP request duration
* HTTP error count
* Database query duration
* Redis error count
* Queue job count
* Queue job failure count
* Active session count

Metrics endpoint’ini production ortamında güvenli hale getir.

---

## 10. Health check sistemi

Aşağıdaki endpoint’leri oluştur:

```text
GET /health
GET /health/live
GET /health/ready
```

Readiness kontrolünde:

* PostgreSQL
* Redis
* Queue bağlantısı

kontrol edilsin.

Liveness endpoint’i harici bağımlılık problemi nedeniyle gereksiz yere uygulamayı restart ettirmemelidir.

Response içerisinde hassas bağlantı bilgisi gösterme.

---

## 11. Merkezi hata yönetimi

Standart bir hata sınıfı oluştur:

```ts
AppError
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
RateLimitError
ExternalServiceError
```

Standart API hata formatı kullan:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_INVALID_CREDENTIALS",
    "message": "E-posta adresi veya şifre hatalı.",
    "details": null,
    "requestId": "..."
  }
}
```

Production ortamında stack trace dönme.

Drizzle hatalarını anlamlı domain veya application hatalarına dönüştür.

Zod validation hatalarını standart response formatına çevir.

---

## 12. Standart başarılı response formatı

Aşağıdaki yapıyı kullan:

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "..."
  }
}
```

Pagination kullanılan endpoint’lerde:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5,
    "requestId": "..."
  }
}
```

---

## 13. Redis kullanımı

Redis’i şu amaçlarla hazırla:

* Cache
* Rate limiting
* Session yardımcı verileri
* Distributed lock
* Queue
* Idempotency kayıtları
* Geçici doğrulama verileri

Cache işlemlerini business logic içerisine doğrudan yerleştirme.

Cache-aside pattern için reusable bir servis oluştur.

Cache key isimlendirme standardı oluştur.

Örnek:

```text
app-name:environment:module:resource:id
```

Redis erişilemediğinde hangi işlemlerin devam edeceğini ve hangilerinin hata vereceğini açıkça belirle.

---

## 14. Queue sistemi

BullMQ kullanarak queue altyapısı oluştur.

Örnek job’lar:

* Verification email gönderme
* Password reset email gönderme
* Audit log işleme
* Analytics event gönderme
* Kullanıcı hesabı silme sonrası temizlik
* Eski session temizliği
* Süresi geçmiş token temizliği

Şunları destekle:

* Retry
* Exponential backoff
* Job timeout
* Dead-letter yaklaşımı
* Idempotent job tasarımı
* Failed job logging
* Queue monitoring
* Graceful shutdown

Queue worker uygulamasını API process’inden ayrı çalıştırılabilir şekilde tasarla.

---

## 15. E-posta servisi

Provider-independent bir mail servisi oluştur.

İlk provider SMTP olabilir.

Şunlar için template hazırla:

* E-posta doğrulama
* Şifre sıfırlama
* Şifre değiştirildi bildirimi
* Yeni cihazdan giriş bildirimi
* Hesap silme bildirimi

Template sistemi hem HTML hem plain-text içerik üretmelidir.

Mail gönderimleri queue üzerinden çalışmalıdır.

Development ortamında gerçek e-posta göndermek yerine Mailpit kullanılabilsin.

Docker Compose içerisine Mailpit ekle.

---

## 16. Dosya yükleme altyapısı

Provider-independent storage abstraction oluştur.

Desteklenecek provider’lar:

* Local storage
* S3-compatible storage

Şunları uygula:

* MIME type kontrolü
* Dosya boyutu limiti
* Güvenli dosya adı
* Rastgele storage key
* Path traversal koruması
* Public ve private dosya ayrımı
* Presigned URL desteği
* Dosya metadata tablosu
* Silme ve erişim yetkilendirmesi

Dosyayı yalnızca uzantısına bakarak doğrulama.

---

## 17. API dokümantasyonu

OpenAPI 3 standardında Swagger dokümantasyonu oluştur.

Aşağıdakileri dokümante et:

* Request body
* Query parametreleri
* Path parametreleri
* Response modelleri
* Authentication gereksinimleri
* Error kodları
* Pagination
* Rate limit davranışı
* OAuth akışları

Dokümantasyon development ortamında açık olsun.

Production ortamında kapatılabilir veya authentication arkasına alınabilir olsun.

---

## 18. Test stratejisi

Aşağıdaki test katmanlarını oluştur:

### Unit test

* Service
* Use-case
* Utility
* Token service
* Encryption service
* Authorization kontrolleri

### Integration test

* PostgreSQL
* Drizzle repository
* Redis
* Queue
* Authentication akışları

### API test

* Register
* Login
* Refresh token
* Logout
* Forgot password
* Reset password
* Email verification
* Google callback senaryosu
* Apple callback senaryosu
* RBAC kontrolleri
* Rate limit
* Validation
* Health check

Testlerde gerçek production database kullanma.

Test database’i izole olmalıdır.

Her test birbirinden bağımsız çalışabilmelidir.

External servisler mock edilebilmelidir.

Minimum coverage hedefi tanımla ancak sadece coverage artırmak için anlamsız test yazma.

---

## 19. Docker altyapısı

Aşağıdaki servisleri içeren `docker-compose.yml` oluştur:

* API
* Worker
* PostgreSQL
* Redis
* Mailpit
* Prometheus
* Grafana
* Loki
* Grafana Alloy veya Promtail

Development ve production Dockerfile’larını ayır.

Production Dockerfile:

* Multi-stage build kullanmalı
* Root olmayan kullanıcıyla çalışmalı
* Sadece gerekli dosyaları içermeli
* Development dependency’lerini taşımamalı
* Health check içermeli
* Küçük ve güvenli bir base image kullanmalı

Volume ve network yapılarını düzenli şekilde oluştur.

---

## 20. CI/CD

GitHub Actions workflow’ları oluştur:

### Pull request workflow

* npm ci
* TypeScript typecheck
* ESLint
* Prettier check
* Unit tests
* Integration tests
* Build
* Drizzle schema validation
* Migration kontrolü
* Dependency audit

### Main branch workflow

* Tüm kontroller
* Docker image build
* Container security scan
* Image tag oluşturma
* Registry push için örnek yapı
* Migration deployment adımı
* Deployment sonrası health check

Secret değerleri workflow dosyasında hard-code etme.

---

## 21. Database migration ve seed

Drizzle migration sistemi kullan.

Aşağıdaki seed verilerini oluştur:

* super-admin rolü
* admin rolü
* user rolü
* temel permission kayıtları
* rollerin permission eşleşmeleri
* development için opsiyonel admin kullanıcısı

Seed işlemi tekrar çalıştırıldığında duplicate kayıt oluşturmamalıdır.

Production migration sürecini README içerisinde açıkla.

Uygulama açılışında otomatik ve kontrolsüz migration çalıştırma.

---

## 22. Audit log

Kritik işlemler için audit log oluştur:

* Login başarı ve başarısızlıkları
* Şifre değiştirme
* Şifre sıfırlama
* Rol değişikliği
* Yetki değişikliği
* Kullanıcı pasifleştirme
* Kullanıcı silme
* OAuth hesabı bağlama
* OAuth hesabı kaldırma
* Session iptal etme

Şifre, token ve secret değerlerini audit log içerisine yazma.

Audit log kayıtları sonradan değiştirilmeyecek şekilde tasarlanmalıdır.

---

## 23. Idempotency

Özellikle ödeme, webhook veya kritik create endpoint’lerinde kullanılabilecek reusable idempotency middleware oluştur.

`Idempotency-Key` header desteği ekle.

Aynı key ve aynı request tekrar geldiğinde önceki response döndürülebilsin.

Aynı key ile farklı request body gönderilirse conflict hatası dön.

Redis ve gerektiğinde database tabanlı yaklaşımı destekleyecek şekilde tasarla.

---

## 24. Webhook altyapısı

Gelecekte Stripe, PayTR, iyzico veya başka provider’lar eklenebileceği için genel webhook yapısı oluştur.

Şunları destekle:

* Raw body erişimi
* Signature verification
* Timestamp kontrolü
* Replay attack koruması
* Idempotency
* Event kayıt tablosu
* Async processing
* Retry
* Failed webhook inceleme
* Provider bazlı adapter yapısı

Webhook endpoint’lerinde normal JSON middleware’in signature kontrolünü bozmasını engelle.

---

## 25. API versioning

Endpoint’leri aşağıdaki şekilde versiyonla:

```text
/api/v1
```

Version bilgisini route organizasyonunda açık şekilde tut.

Gelecekte v2 eklendiğinde mevcut v1 kodunun gereksiz yere bozulmayacağı bir yapı oluştur.

---

## 26. Kod kalitesi kuralları

Aşağıdaki kurallara uy:

* `any` kullanımını mümkün olduğunca yasakla
* Strict TypeScript kullan
* Magic string ve magic number kullanımını azalt
* Fonksiyonları küçük ve tek sorumluluklu tut
* Controller içinde business logic yazma
* Repository katmanında HTTP bilgisi kullanma
* Infrastructure hatalarını doğrudan dışarı sızdırma
* Circular dependency oluşturma
* Global mutable state kullanma
* Gereksiz singleton kullanımından kaçın
* Date işlemlerini UTC tabanlı yap
* Kullanıcı timezone bilgisini yalnızca gösterim ve business rule gerektiğinde kullan
* Tüm ID alanlarında UUID veya UUIDv7 yaklaşımını değerlendir

Her önemli mimari karar için kısa açıklama ekle.

---

## 27. Script’ler

`package.json` içerisinde en az şu script’leri oluştur:

```json
{
  "dev": "...",
  "build": "...",
  "start": "...",
  "start:prod": "...",
  "worker:dev": "...",
  "worker:start": "...",
  "lint": "...",
  "lint:fix": "...",
  "format": "...",
  "format:check": "...",
  "typecheck": "...",
  "test": "...",
  "test:unit": "...",
  "test:integration": "...",
  "test:e2e": "...",
  "test:coverage": "...",
  "Drizzle:generate": "...",
  "Drizzle:migrate:dev": "...",
  "Drizzle:migrate:deploy": "...",
  "Drizzle:studio": "...",
  "db:seed": "...",
  "docker:up": "...",
  "docker:down": "..."
}
```

---

## 28. README

Eksiksiz bir README hazırla.

README şu bölümleri içermelidir:

* Projenin amacı
* Mimari yaklaşım
* Teknoloji yığını
* Gereksinimler
* Lokal kurulum
* Environment değişkenleri
* Docker ile çalıştırma
* Migration
* Seed
* API çalıştırma
* Worker çalıştırma
* Testler
* Swagger
* OAuth kurulumu
* Google Console ayarları
* Apple Developer ayarları
* Sentry kurulumu
* PostHog kurulumu
* Loki ve Grafana kurulumu
* Deployment
* Güvenlik notları
* Yeni modül ekleme rehberi
* Yeni provider ekleme rehberi
* Production checklist
* Sorun giderme

README içerisindeki komutlar gerçek ve çalıştırılabilir olmalıdır.

---

## 29. Architecture dokümantasyonu

Aşağıdaki dokümanları oluştur:

```text
docs/
├── ARCHITECTURE.md
├── AUTHENTICATION.md
├── AUTHORIZATION.md
├── OBSERVABILITY.md
├── SECURITY.md
├── DATABASE.md
├── QUEUES.md
├── DEPLOYMENT.md
├── TESTING.md
└── ADDING_A_MODULE.md
```

`ARCHITECTURE.md` içerisinde:

* Katmanlar
* Katmanlar arası bağımlılıklar
* Request lifecycle
* Authentication lifecycle
* Queue lifecycle
* Event lifecycle
* Hata yönetimi
* Modül iletişim kuralları
* Kabul edilen ve edilmeyen bağımlılıklar

açıklanmalıdır.

---

## 30. Template repository yaklaşımı

Bu proje yeni projelerde başlangıç iskeleti olarak kullanılacağı için proje adına özel domain kodu yazma.

Örnek domain olarak yalnızca:

* Auth
* User
* Role
* Permission
* Session
* Notification
* Audit Log
* File

modüllerini oluştur.

Yeni proje başlatıldığında kolayca değiştirilebilmesi için aşağıdaki değerleri merkezi hale getir:

* Uygulama adı
* Package adı
* Docker image adı
* Database adı
* Redis prefix
* Cookie adı
* JWT issuer
* JWT audience
* Mail gönderen adı
* Swagger başlığı

Starter kit’e özgü isimleri kodun farklı yerlerine dağıtma.

---

## 31. Feature flag altyapısı

Basit bir feature flag sistemi oluştur.

Şu kaynaklardan flag okunabilsin:

* Environment variable
* Database
* PostHog feature flags için adapter

Örnek flag’ler:

* google_login_enabled
* apple_login_enabled
* registration_enabled
* email_verification_required
* maintenance_mode

Feature flag kontrollerini controller’lara dağınık şekilde yazma.

---

## 32. Uygulama event sistemi

Modüller arası doğrudan sıkı bağımlılığı azaltmak için internal event sistemi oluştur.

Örnek event’ler:

* UserRegistered
* UserLoggedIn
* EmailVerified
* PasswordChanged
* UserDeleted
* OAuthAccountConnected

Event handler’lar:

* E-posta gönderme
* Analytics gönderme
* Audit log oluşturma
* Cache temizleme

gibi yan etkileri yönetebilsin.

Kritik transaction tamamlanmadan dış sistemlere event gönderme.

Gerekli yerlerde transactional outbox pattern için genişletilebilir bir altyapı hazırla ve kullanım kararını dokümante et.

---

## 33. Teslim biçimi

Çalışmayı aşamalar halinde gerçekleştir:

### Aşama 1 — Mimari plan

Önce aşağıdakileri sun:

1. Mimari kararlar
2. Kullanılacak paketler
3. Klasör yapısı
4. Database şeması
5. Authentication akışı
6. Observability akışı
7. Güvenlik yaklaşımı
8. Riskler ve trade-off’lar

### Aşama 2 — Temel altyapı

* TypeScript
* Express
* Environment validation
* Drizzle
* Redis
* Logging
* Error handling
* Request context
* Docker

### Aşama 3 — Authentication

* Email/password
* JWT
* Refresh token rotation
* Session management
* Google login
* Apple login
* Email verification
* Password reset

### Aşama 4 — Authorization ve ortak modüller

* RBAC
* Audit log
* Notification
* File storage
* Queue
* Feature flags

### Aşama 5 — Observability

* Sentry
* PostHog
* Prometheus
* Loki
* Grafana

### Aşama 6 — Test ve dokümantasyon

* Unit test
* Integration test
* API test
* Swagger
* README
* Architecture dokümanları

Her aşamada kodun build edildiğini, lint kontrolünden geçtiğini ve ilgili testlerin başarılı olduğunu doğrula.

---

## 34. Son kontrol listesi

Çalışma tamamlandığında aşağıdaki maddeleri tek tek doğrula:

* Uygulama temiz kurulumda çalışıyor mu?
* Docker Compose ile ayağa kalkıyor mu?
* Migration’lar sorunsuz çalışıyor mu?
* Seed tekrar çalıştırılabilir mi?
* Register ve login çalışıyor mu?
* Refresh token rotation çalışıyor mu?
* Reuse detection çalışıyor mu?
* Google OAuth akışı hazır mı?
* Apple OAuth akışı hazır mı?
* Şifre sıfırlama çalışıyor mu?
* E-posta doğrulama çalışıyor mu?
* RBAC çalışıyor mu?
* Rate limit çalışıyor mu?
* Sentry hata yakalıyor mu?
* PostHog event gönderiyor mu?
* Loglar stdout’a yazılıyor mu?
* Loki/Grafana örneği çalışıyor mu?
* Prometheus metrics üretiliyor mu?
* Worker API’den bağımsız çalışıyor mu?
* Testler başarılı mı?
* Swagger eksiksiz mi?
* README komutları doğru mu?
* Hassas bilgiler loglardan maskeleniyor mu?
* Graceful shutdown çalışıyor mu?
* Production Docker image root olmayan kullanıcıyla çalışıyor mu?

Eksik veya yalnızca placeholder bırakılmış alanları açıkça belirt.

Çalışmayan bir entegrasyonu tamamlanmış gibi gösterme.

---

## 35. Önemli uygulama kuralları

* Mevcut dosyaları incelemeden rastgele değiştirme.
* Her değişiklikten önce ilgili modülü ve bağımlılıkları analiz et.
* Kod üretirken yalnızca teorik örnekler verme; çalıştırılabilir dosyalar oluştur.
* Gerçek secret değer üretip repository’ye ekleme.
* `.env.example` içerisinde yalnızca açıklayıcı placeholder kullan.
* Test edilmeyen kodu tamamlanmış kabul etme.
* TODO bırakıldığında nedenini ve tamamlanması için gereken adımları yaz.
* Hataları sessizce yutma.
* External servis hatalarının ana business transaction üzerindeki etkisini bilinçli şekilde belirle.
* Güvenlik ile ilgili kararlarda kolaylık uğruna zayıf varsayılanlar kullanma.
* Tüm sistemi tek seferde kontrolsüz şekilde üretmek yerine aşamalı ve doğrulanabilir ilerle.
* Her aşama sonunda değiştirilen dosyaları ve alınan kararları özetle.

Bu gereksinimlere göre yeniden kullanılabilir, güvenli, temiz ve production-ready bir Node.js backend starter kit oluştur.
