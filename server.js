const express = require("express");
const session = require("express-session");
const passport = require("passport");
const SteamStrategy = require("passport-steam").Strategy;
const axios = require("axios");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

passport.use(
  new SteamStrategy(
    {
      returnURL: "http://localhost:3000/auth/steam/return",
      realm: "http://localhost:3000/",
      apiKey: process.env.STEAM_API_KEY,
    },
    (identifier, profile, done) => {
      process.nextTick(() => {
        profile.identifier = identifier;
        return done(null, profile);
      });
    }
  )
);

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.get("/", (req, res) => {
  if (req.isAuthenticated()) {
    const steamId = req.user.id;
    const apiKey = process.env.STEAM_API_KEY;
    const inventoryUrl = `https://api.steampowered.com/IEconItems_440/GetPlayerItems/v0001/?key=${apiKey}&SteamID=${steamId}`;

    axios
      .get(inventoryUrl)
      .then((response) => {
        const inventory = response.data.result.items;
        res.render("inventory", { user: req.user, inventory });
      })
      .catch((error) => {
        console.error(
          "Error fetching inventory:",
          error.response ? error.response.data : error.message
        );
        res.send("Error fetching inventory.");
      });
  } else {
    res.send(
      'Hello, TF2 MvM Helper! Please <a href="/auth/steam">log in with Steam</a>.'
    );
  }
});

app.get(
  "/auth/steam",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "/" }),
  (req, res) => {
    res.redirect("/");
  }
);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
