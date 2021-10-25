export default function apiCall(reqOps) {
  return new Promise((resolve, reject) => {
    request(reqOps, (err, res, body) => {
      if (!error && response.statusCode == 200) {
        resolve(JSON.parse(body));
      }

      reject(err);
    });
  });
}
