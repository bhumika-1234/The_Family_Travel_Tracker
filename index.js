import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

var curruser=1;
const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "school",
  password: "abcd1234",
  port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

let currentUserId = 1;

let users = [
  { id: 1, name: "Angela", color: "teal" },
  { id: 2, name: "Jack", color: "powderblue" },
];

async function checkVisisted(user_id) {
  const result = await db.query("Select countries.country_code from visited_countries JOIN users ON users.id=visited_countries.user_id join countries on countries.id=visited_countries.country_id where users.id="+user_id);
  let countries = [];
  result.rows.forEach((country) => {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => {
  const countries = await checkVisisted(curruser);
  var search=0;
  for(var i=0;i<users.length;i++){
    if(users[i].id===curruser) search=i;
  }
  var col=users[search].color;
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: col,
  });
});

app.post("/add", async (req, res) => {
  const input = req.body["country"];

  try {
    const result = await db.query(
      "Select * from countries where countries.country_name='"+input+"'"
    );
    console.log(result.rows);
    const data = result.rows[0];
    const countryCode = data.id;
    try {
      await db.query(
        "INSERT INTO visited_countries VALUES("+curruser+","+countryCode+")"
      );
      res.redirect("/");
    } catch (err) {
      console.log(err);
    }
  } catch (err) {
    console.log(err);
  }
});

app.post("/user", async (req, res) => {
  if(req.body.user){
  curruser=parseInt(req.body.user)
  console.log(curruser)
  const countries=await checkVisisted(req.body.user);
  var search=0;
  for(var i=0;i<users.length;i++){
    if(users[i].id===parseInt(req.body.user)) search=i;
  }
  var col=users[search].color;
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: col,
  });
}else{
  res.render("new.ejs")
}
});

app.post("/new", async (req, res) => {
  //Hint: The RETURNING keyword can return the data that was inserted.
  //https://www.postgresql.org/docs/current/dml-returning.html
  const newuser=await db.query("INSERT INTO users(name) values('"+req.body.name+"') RETURNING users.id");
  console.log(newuser.rows);
  users.push({
    id: parseInt(newuser.rows[0].id),
    name: req.body.name,
    color: req.body.color
  })
  console.log(users)
  curruser= parseInt(newuser.rows[0].id);
  res.redirect("/")
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Select country_code
// from visited_countries
// join users On users.id=visited_countries.user_id
// join countries on countries.id=visited_countries.country_id
// where users.id=2