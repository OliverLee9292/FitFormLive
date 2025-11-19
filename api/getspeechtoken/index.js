// api/getspeechtoken/index.js
const https = require("https");

function getToken(region, key) {
  const options = {
    hostname: `${region}.api.cognitive.microsoft.com`,
    path: "/sts/v1.0/issueToken",
    method: "POST",
    headers: {
      "Ocp-Apim-Subscription-Key": key,
      "Content-Type": "application/x-www-form-urlencoded",
      "Content-Length": 0
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(body);
        } else {
          reject(
            new Error(
              `Token request failed: ${res.statusCode} ${body.toString()}`
            )
          );
        }
      });
    });

    req.on("error", reject);
    req.end();
  });
}

module.exports = async function (context, req) {
  const speechKey = process.env.SPEECH_KEY;
  const speechRegion = process.env.SPEECH_REGION;

  if (!speechKey || !speechRegion) {
    context.log("Missing SPEECH_KEY or SPEECH_REGION");
    context.res = {
      status: 500,
      body: "Speech service not configured on server."
    };
    return;
  }

  try {
    const token = await getToken(speechRegion, speechKey);

    context.res = {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      },
      body: {
        token,
        region: speechRegion
      }
    };
  } catch (err) {
    context.log("Error getting token:", err);
    context.res = {
      status: 500,
      body: "Failed to fetch speech token."
    };
  }
};