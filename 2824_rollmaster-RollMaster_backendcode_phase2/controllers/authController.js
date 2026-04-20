const jwt = require("jsonwebtoken");
const db = require("../connection/dbConnection.js");
const axios = require("axios");

const refreshtoken = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const kvp_backend_url = req.body.kvp_backend_url;
  if (!authHeader) {
    return res
      .status(401)
      .json({ status: false, msg: "Authorization header is missing" });
  }

  
    // Call another backend API after user verification
    try {
      const externalApiUrl = `${kvp_backend_url}refresh_token_for_review`;
      const externalApiResponse = await axios.get(
        externalApiUrl
      );
      // Handle response from external API
      if (externalApiResponse.status === 200) {
        return res.status(200).json({
          status: true,
          msg: "Token refreshed successfully",
          token: externalApiResponse.data.token,
          userDetails: externalApiResponse.data.userDetails,
        });
      } else {
        return res.status(400).json({
          status: false,
          msg: "External API request failed",
          details: externalApiResponse.data,
        });
      }
    } catch (error) {
      return res.status(500).json({
        status: false,
        msg: "Error calling external API",
        error: error.message,
      });
    }
};


const refreshtokenreview = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (authHeader) {
      const token = authHeader.split(' ')[1]; // Extracting the token part
      const secretKey = "ACS123";
      jwt.verify(token, secretKey, async (err, decoded) => {
          if (err) {
              return res.status(403).json({ "status": false, "message": 'authorization failed' });
          }
          else {
              const sql = "SELECT kvp_user_info.* , kvp_user_type_info.allowed_actions FROM kvp_user_info left join  kvp_user_type_info on kvp_user_info.user_type = kvp_user_type_info.user_type where email = ?;";
              const values = [decoded.email];

              try {
                  await db.addQuery("sql",sql);
                  const result = await db.runQuery("sql", values);
                  if (result && result.data.length !== 0 && result.data[0].status?.toUpperCase() === "ACTIVE") {

                      const user = {
                          "id": result.data[0].id,
                          "email": result.data[0].email
                      };
                      const expiresIn = 2592000;
                      const secretKey = "ACS123";
                      const token = jwt.sign(user, secretKey, { expiresIn });
                      return res.status(200).json({ "status": true, "message": "Login Successfully!!!", "token": token, "userDetails": result.data[0] });

                  }
                  else if (result && result.data.length !== 0 && result.data[0].status?.toUpperCase() === "INACTIVE") {
                      res.status(501).json({ status: false, message: "User is Inactive" });
                  }
              } catch (error) {
                  res.status(501).json({ status: false, message: error.message });
              }
          }
      })
  } else {
      // No Authorization header provided
      return res.status(401).json({ "status": false, "msg": "authorization is not set in header" });
  }
};

const authorization = async (req, res, next) => {
  const authHeader = req.headers["authorization"];
  let response;
  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Extracting the token part
    const secretKey = "ACS123";
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        response = { status: false, message: "authorization failed" };
      } else {
        response = { status: true, message: decoded };
      }
    });
  } else {
    // No Authorization header provided
    response = { status: false, message: "authorization is not set in header" };
  }
  return response;
};

//check token expiration
const checkExpire = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (authHeader) {
    const token = authHeader.split(" ")[1]; // Extracting the token part
    const secretKey = "ACS123";

    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        // Token is invalid or expired
        if (err.name === "TokenExpiredError") {
          return res
            .status(501)
            .json({ status: false, msg: "token is expired" });
          // Perform actions for an expired token
        } else {
          // Other token validation errors
          return res
            .status(501)
            .json({ status: false, msg: "token is invalid or expired" });
        }
      } else {
        // Token is valid and not expired
        return res
          .status(200)
          .json({ status: true, msg: "token is not expired" });
      }
    });
  } else {
    // No Authorization header provided
    return res
      .status(501)
      .json({ status: false, msg: "authorization is not set in header" });
  }
};

module.exports = {
  refreshtoken,
  authorization,
  refreshtokenreview,
  checkExpire,
};
