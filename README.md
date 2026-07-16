# Soe Ye Htut - Frontend Developer Portfolio

Welcome to the repository for my personal portfolio website! This project showcases my skills, experience, and projects as a Junior Frontend Developer.

## 🚀 Overview

This portfolio is a full-stack web application built to highlight my expertise in Frontend technologies (HTML, CSS, JavaScript, React) while also demonstrating backend capabilities. It features a modern, responsive design and includes a dynamic dashboard for managing portfolio content.

## 🛠️ Technologies Used

- **Frontend:** HTML5, CSS3, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (via `pg`)
- **File Uploads:** Multer
- **Deployment:** Vercel (Serverless Functions)

## 📁 Project Structure

- `deepCV/`: Contains the core application logic.
  - `index.html`: The main portfolio landing page.
  - `dashboard.html`: An admin dashboard for managing content.
  - `server.js`: The Express.js backend server.
  - `uploads/`: Directory for uploaded images and files.
- `api/`: Contains the entry point for Vercel serverless deployment (`index.js`).
- `vercel.json`: Configuration file for routing and deploying on Vercel.

## 💻 Getting Started (Local Development)

To run this project locally on your machine, follow these steps:

### Prerequisites

- [Node.js](https://nodejs.org/) installed on your machine.
- A PostgreSQL database (optional, if you want to test database features).

### Installation

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd soeyehtut-portfolio-main
   ```

2. **Navigate to the app directory:**
   ```bash
   cd deepCV
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   npm start
   ```

5. **Open in Browser:**
   Visit `http://localhost:3000` (or the port specified in your console) to view the portfolio.

## 🌐 Deployment

This project is configured for seamless deployment on [Vercel](https://vercel.com).
The `vercel.json` file handles routing all `/api/*` requests to the Express backend and serves the static frontend files from the root.

## 📬 Contact

Feel free to reach out if you have any questions or want to collaborate!

- **Name:** Soe Ye Htut
- **Role:** Junior Frontend Developer
