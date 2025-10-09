<?php
// Database connection
$servername = "localhost";
$username = "root"; // default for XAMPP
$password = "";
$dbname = "tindog_register";

$conn = new mysqli($servername, $username, $password, $dbname);
if ($conn->connect_error) {
  die("Connection failed: " . $conn->connect_error);
}

// Get form data
$firstName = $_POST['firstName'] ?? '';
$email = $_POST['email'] ?? '';
$passwordPlain = $_POST['password'] ?? '';

if (empty($firstName) || empty($email) || empty($passwordPlain)) {
  die("Please fill out all fields.");
}

// Hash password securely
$passwordHash = password_hash($passwordPlain, PASSWORD_DEFAULT);

// Insert user
$stmt = $conn->prepare("INSERT INTO users (first_name, email, password_hash) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $firstName, $email, $passwordHash);

if ($stmt->execute()) {
  header("Location: ../new-profile.html"); // Redirect on success
  exit();
} else {
  echo "Error: " . $stmt->error;
}

$stmt->close();
$conn->close();
?>
