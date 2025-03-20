# Amber Backend

Amber Backend is the server-side application for the Amber project, built with **Node.js**, **Express**, and **TypeScript**. It provides authentication, user management, email notifications, and other core functionalities.

## ✨ Features

- User authentication (Login, Register, Password Reset)
- Profile management (Upload profile pictures)
- Email notifications (Verification & Password Reset)
- Secure API endpoints with validation & middleware
- File uploads using **Multer** and **Cloudinary**
- JSON Web Token (JWT) authentication

---

## 📺 Tech Stack

- **Node.js** & **Express.js** – Backend framework
- **TypeScript** – Typed JavaScript for reliability
- **MongoDB** & **Mongoose** – Database & ORM
- **Cloudinary** – File uploads
- **Multer** – File handling middleware
- **Nodemailer** – Email sending
- **Zod** – Request validation
- **Husky & Lint-Staged** – Pre-commit hooks for code quality

---

## 💂️ Project Structure

```
amber-backend
│—— src/
│   ├—— config/           # Configuration files (DB, Environment variables)
│   ├—— controllers/      # Route handlers
│   ├—— errors/           # Custom error handlers
│   ├—— middlewares/      # Authentication & validation middleware
│   ├—— models/           # Mongoose models
│   ├—— routes/           # API routes
│   ├—— services/         # Business logic & integrations
│   │   ├—— nodemailer/   # Email service
│   ├—— validations/      # Input validation schemas
│   └—— index.ts          # Main entry point
│—— .env                  # Environment variables
│—— package.json          # Dependencies & scripts
│—— tsconfig.json         # TypeScript config
│—— README.md             # Project documentation
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/sanite1/amber-backend.git
cd amber-backend
```

### 2️⃣ Install Dependencies

Using **npm**:

```bash
npm install
```

Using **pnpm**:

```bash
pnpm install
```

### 3️⃣ Set Up Environment Variables

Create a `.env` file and add the following:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
AUTH_EMAIL=your_email@example.com
AUTH_PASS=your_email_password
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_SECRET=your_cloudinary_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
```

### 4️⃣ Run the Server

For development:

```bash
npm run dev
```

For production:

```bash
npm run build && npm start
```

---

## 🐐 API Endpoints

### 📝 Authentication

| Method | Endpoint                     | Description     | Protected |
| ------ | ---------------------------- | --------------- | --------- |
| POST   | `/api/login`                 | Login User      | ❌        |
| POST   | `/api/register`              | Register User   | ❌        |
| POST   | `/api/forgot-password`       | Forgot Password | ❌        |
| PATCH  | `/api/reset-password/:token` | Reset Password  | ❌        |

### 👤 User Management

| Method | Endpoint                         | Description         | Protected |
| ------ | -------------------------------- | ------------------- | --------- |
| GET    | `/api/users/:id`                 | Get User by ID      | ✅        |
| PATCH  | `/api/users/:id`                 | Update User Profile | ✅        |
| PATCH  | `/api/users/update-password/:id` | Update Password     | ✅        |

---

## 🛠️ Development Tools

### ✨ Code Formatting & Linting

Run ESLint to check code quality:

```bash
npm run lint
```

Format code with Prettier:

```bash
npm run format
```

### 🔍 Pre-commit Hooks

Husky is set up to run `lint-staged` before commits.

```bash
npx husky install
```

---

## 📌 Deployment

1. Build the project:

   ```bash
   npm run build
   ```

2. Deploy using **Vercel**, **Railway**, or **Docker**.

---

## 💡 Contributions

Feel free to submit issues and pull requests!

1. Fork the repo.
2. Create a feature branch (`feat-new-feature`).
3. Commit your changes.
4. Submit a pull request.

---

## 📄 License

This project is licensed under the **MIT License**.
