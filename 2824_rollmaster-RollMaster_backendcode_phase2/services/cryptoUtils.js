const crypto = require("crypto");
const algorithm = "aes-256-cbc";
let secretKey = "12121212121212121212121212121212";

// Function to encrypt password
const encryptPassword = (password) => {
   const cipher = crypto.createCipheriv(algorithm, secretKey, Buffer.alloc(16));
   let encryptedData = cipher.update(password, "utf-8", "hex");
   encryptedData += cipher.final("hex");
    return encryptedData;
};

// Function to decrypt password
const decryptPassword = (encryptedPassword) => {
    const decipher = crypto.createDecipheriv(algorithm,secretKey,Buffer.alloc(16));
    let decryptedData = decipher.update(encryptedPassword, "hex", "utf-8");
    decryptedData += decipher.final("utf-8");
    return decryptedData;
};

module.exports = {
    encryptPassword,
    decryptPassword
};
