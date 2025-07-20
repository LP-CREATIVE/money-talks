require('dotenv').config();
const jwt = require('jsonwebtoken');

const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6Imx1Y2FzQGxwY3JlYXRpdmUuc3R1ZGlvIiwicXVlc3Rpb25JZCI6ImNtZDBvaGNkazAwMG5saTh1aDhyNjA1Zm8iLCJpc0RlbW8iOnRydWUsImlhdCI6MTc1Mjg2MDQ5NywiZXhwIjoxNzUzNDY1Mjk3fQ.MQis1oMBShjaghCFZIfuVdz-hG1TX_KZc6ZTRe0If9Y';

console.log('JWT_SECRET loaded:', !!process.env.JWT_SECRET);
console.log('JWT_SECRET value:', process.env.JWT_SECRET);
console.log('\nDecoded token:', jwt.decode(token));

try {
  const verified = jwt.verify(token, process.env.JWT_SECRET);
  console.log('\nToken verified successfully!');
  console.log('Verified payload:', verified);
} catch (error) {
  console.log('\nVerification failed!');
  console.log('Error:', error.message);
}
