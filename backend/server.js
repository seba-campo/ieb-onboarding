const express = require('express');
const cors = require('cors');
require('dotenv').config({ path: require('path').resolve(__dirname, '.env.local') });

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*' 
}));

app.use(express.json());


const PORT = process.env.BASE_PORT || 3002;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});