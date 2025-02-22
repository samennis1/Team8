


# Team8 Project

Welcome to the **Team8** project! This repository contains a **React Native** application built with **NativeWind** for styling and supports both iOS and Android platforms.

## 📌 Features
- **React Native with Expo/CLI**
- **NativeWind (Tailwind CSS for React Native)**
- **FlatList for dynamic content**
- **Custom UI components**
- **Responsive design**

---

## 🚀 Getting Started
### 1️⃣ Clone the Repository
```sh
git clone https://github.com/samennis1/Team8.git
cd Team8
```

### 2️⃣ Install Dependencies
Make sure you have **Node.js** installed, then run:
```sh
npm install
```
If using **Yarn**:
```sh
yarn install
```

### 3️⃣ Install Expo CLI (if using Expo)
```sh
npm install -g expo-cli
```

### 4️⃣ Run the Project
For Expo:
```sh
npx expo start
```
For React Native CLI:
```sh
npx react-native run-android   # For Android
npx react-native run-ios       # For iOS
```

---

## 🛠 Configuration
### Tailwind Setup (`tailwind.config.js`)
```js
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [],
};
```
### Babel Configuration (`babel.config.js`)
```js
module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['nativewind/babel'],
  };
};
```

---

## 📂 Project Structure
```
Team8/
│── assets/             # Static images & assets
│── components/         # UI components
│── screens/            # Application screens
│── App.tsx             # Main entry file
│── package.json        # Dependencies & scripts
│── tailwind.config.js  # Tailwind configuration
│── babel.config.js     # Babel configuration
│── tsconfig.json       # TypeScript config
```

---

## 📝 Contribution
1. Fork the repository to your one 🍴
2. Create a new branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m "Added new feature"`)
4. Push to your branch (`git push origin feature-name`)
5. Open a Pull Request 🚀

---

## 📜 License
This project is open-source and available under the **MIT License**.

---

## 📧 Contact
For any questions or suggestions, feel free to open an issue or contact pavitgo5@gmail.com


