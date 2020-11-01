const fs = require('fs');
const request = require('request');
const http = require('http');
const PORT = 3000;
const cars = [];

const startContentBlock = '<div id="searchResults">';
const endContentBlock =
  '<div class="infiltrate fl-l git remote add origin git@github.com:popeskul/node-json.gitpopup-filter" id="leftFilter">';

function generateDate(date) {
  const newDate = new Date(date);
  const YYYY = newDate.getFullYear();
  const MM = newDate.getMonth() + 1;
  const DD = newDate.getDate();
  const HH = newDate.getHours();
  const mm = newDate.getMinutes();
  const SS = newDate.getMilliseconds();

  return `${YYYY}${MM}${DD}-${HH}${mm}${SS}`;
}

function saveCSVCars(name, arr) {
  try {
    if (!name) throw 'Provide name';
    if (!arr || !arr.length) throw 'Arr must be exist';
    fs.writeFileSync(`${name}-${generateDate(Date.now())}.csv`, arr);
  } catch (error) {
    console.log(error);
  }
}

function generateCSVTable(string) {
  const TABLE_HEAD = '<table>';
  let TABLE_BODY = '';
  const TABLE_FOOTER = '</table>';

  const rows = string.split('\n');

  rows.map((row) => {
    TABLE_BODY += '<tr>';
    row.split(';').map((td) => {
      TABLE_BODY += `<td>${td}</td>`;
    });
    TABLE_BODY += '</tr>';
  });

  return TABLE_HEAD + TABLE_BODY + TABLE_FOOTER;
}

request(
  'https://auto.ria.com/uk/search/?category_id=1&marka_id=2233&model_id=0&city%5B0%5D=0&state%5B0%5D=0&s_yers%5B0%5D=0&po_yers%5B0%5D=0&price_ot=&price_do=',
  (e, r, body) => {
    const findstartIndex = body.indexOf(startContentBlock);
    const findEndIndex = body.indexOf(endContentBlock);
    const mainBody = body.slice(findstartIndex, findEndIndex);

    const removeChars = mainBody
      .replace(/^\s*\n/gm, '')
      .replace(/\t/g, '')
      .replace(/\n/g, '');

    const dirtyCars = removeChars.split('<div class="content-bar"> ');
    const cleanCar = dirtyCars.splice(1, dirtyCars.length - 2);

    cleanCar.map((text) => {
      const car = {
        model: null,
        year: null,
        uah: null,
        usd: null
      };
      const modelStart = text.indexOf('<span class="blue bold">');
      const modelEnd = text.indexOf('</span>&nbsp;грн');

      const carString = text.slice(modelStart, modelEnd);

      const model = carString
        .split('<span class="blue bold">')[1]
        .split('</span> ')[0];
      const uah = carString
        .split('<span data-currency="UAH">')[1]
        .split(model)
        .join();
      const usd = carString
        .split('data-currency="USD">')[1]
        .split('</span>&nbsp;<span class="bold green size22">')[0];
      const year = carString
        .split(`<span class="blue bold">${model}</span> `)[1]
        .split(' </a> </div> ')[0];

      if (model) car.model = `"${model}"`;
      if (year) car.year = Number(year);
      if (uah) car.uah = Number(uah.replace(/\s/g, ''));
      if (usd) car.usd = Number(usd.replace(/\s/g, ''));
      cars.push(car);
    });

    let CARS_STRING = '';
    cars.map((car) => (CARS_STRING += `${Object.values(car).join(';')}\n`));

    saveCSVCars('pasha', CARS_STRING);

    const server = http.createServer((req, res) => {
      res.setHeader('Content-Type', 'text/html');
      res.write(generateCSVTable(CARS_STRING));
      res.end();
    });

    server.listen(PORT, () => console.log('Server started'));
  }
);
