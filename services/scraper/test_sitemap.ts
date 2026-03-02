import axios from 'axios'; async function run() { const {data} = await axios.get('https://www.rablighting.com/sitemap.xml'); console.log(data); } run();
