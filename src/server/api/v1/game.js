/* Copyright G. Hemingway, 2020 - All rights reserved */
"use strict";

const Joi = require("@hapi/joi");
const {
  initialState,
  shuffleCards,
  filterGameForProfile,
  filterMoveForResults,
  validateMove
} = require("../../solitaire");

module.exports = app => {
  /**
   * Create a new game
   *
   * @param {req.body.game} Type of game to be played
   * @param {req.body.color} Color of cards
   * @param {req.body.draw} Number of cards to draw
   * @return {201 with { id: ID of new game }}
   */
  app.post("/v1/game", async (req, res) => {
    if (!req.session.user) {
      res.status(401).send({ error: "unauthorized" });
    } else {
      let data;
      try {
        // Validate user input
        let schema = Joi.object().keys({
          game: Joi.string()
            .lowercase()
            .required(),
          color: Joi.string()
            .lowercase()
            .required(),
          draw: Joi.any()
        });
        data = await schema.validateAsync(req.body);
      } catch (err) {
        const message = err.details[0].message;
        console.log(`Game.create validation failure: ${message}`);
        return res.status(400).send({ error: message });
      }

      // Set up the new game
      try {
        let newGame = {
          owner: req.session.user._id,
          active: true,
          cards_remaining: 52,
          color: data.color,
          game: data.game,
          score: 0,
          start: Date.now(),
          winner: "",
          state: []
        };
        switch (data.draw) {
          case "Draw 1":
            newGame.drawCount = 1;
            break;
          case "Draw 3":
            newGame.drawCount = 3;
            break;
          default:
            newGame.drawCount = 1;
        }
        // Generate a new initial game state
        newGame.state = initialState();
        let game = new app.models.Game(newGame);
        await game.save();
        const query = { $push: { games: game._id } };
        // Save game to user's document too
        await app.models.User.findByIdAndUpdate(req.session.user._id, query);
        res.status(201).send({ id: game._id });
      } catch (err) {
        console.log(`Game.create save failure: ${err}`);
        res.status(400).send({ error: "failure creating game" });
        // Much more error management needs to happen here
      }
    }
  });

  /**
   * Fetch game information
   *
   * @param (req.params.id} Id of game to fetch
   * @return {200} Game information
   */
  app.get("/v1/game/:id", async (req, res) => {
    try {
      let game = await app.models.Game.findById(req.params.id);
      if (!game) {
        res.status(404).send({ error: `unknown game: ${req.params.id}` });
      } else {
        const state = game.state.toJSON();
        let results = filterGameForProfile(game);
        results.start = Date.parse(results.start);
        results.cards_remaining =
          52 -
          (state.stack1.length +
            state.stack2.length +
            state.stack3.length +
            state.stack4.length);
        // Do we need to grab the moves
        if (req.query.moves === "") {
          const moves = await app.models.Move.find({ game: req.params.id });
          state.moves = moves;//moves.map(move => filterMoveForResults(move));
        }
        res.status(200).send(Object.assign({}, results, state));
      }
    } catch (err) {
      console.log(`Game.get failure: ${err}`);
      res.status(404).send({ error: `unknown game: ${req.params.id}` });
    }
  });

  /**
   * Validate the movement and add card movement information
   *
   * @param (req.params.id} Id of game to fetch
   * @return {200} Validation result
   */
  app.put("/v1/game/setstate/:id", async (req, res) => {
    if (!req.session.user) {
      res.status(401).send({ error: "unauthorized" });
    } else {
      let data;
      try {
        // Validate user input
        let schema = Joi.object().keys({
          stack: Joi.array(),
          draw: Joi.array(),
          discard: Joi.array(),
          pile: Joi.array()
        });
        data = await schema.validateAsync(req.body);
      } catch (err) {
        const message = err.details[0].message;
        console.log(`Move.create validation failure: ${message}`);
        return res.status(400).send({ error: message });
      }
      let state = {};
      if(!(data.draw[0].length == 0 && data.discard[0].length == 0)) {
        state.draw = data.draw[0];
        state.discard = data.discard[0];
        state.pile1 = data.pile[0];
        state.pile2 = data.pile[1];
        state.pile3 = data.pile[2];
        state.pile4 = data.pile[3];
        state.pile5 = data.pile[4];
        state.pile6 = data.pile[5];
        state.pile7 = data.pile[6];
        state.stack1= data.stack[0];
        state.stack2 = data.stack[1];
        state.stack3 = data.stack[2];
        state.stack4 = data.stack[3];
        let  query = { state: state };
        // Set game status
        await app.models.Game.findByIdAndUpdate(req.params.id, query);
        console.log(data.discard);
        console.log("game status changed.");
      }

      res.status(201).send({ ok: "ok"});
    }
  });

  /**
   * Validate the movement and add card movement information
   *
   * @param (req.params.id} Id of game to fetch
   * @return {200} Validation result
   */
  app.put("/v1/game/:id", async (req, res) => {
    if (!req.session.user) {
      res.status(401).send({ error: "unauthorized" });
    } else {
      let data;
      try {
        // Validate user input
        let schema = Joi.object().keys({
          src: Joi.string()
            .lowercase()
            .required(),
          dst: Joi.string()
            .lowercase()
            .required(),
          cards: Joi.array()
        });
        data = await schema.validateAsync(req.body);
      } catch (err) {
        const message = err.details[0].message;
        console.log(`Move.create validation failure: ${message}`);
        return res.status(400).send({ error: message });
      }

      // Movement validation
      let game = await app.models.Game.findById(req.params.id);
      let result = validateMove(game.state, data);
      if (result.result != "success") {
        console.log(`Move.invalid movement.`);
        return res.status(400).send({ error: "invalid movement" });
      }

      // Add the new movement
      try {
        let newMove = {
          user: req.session.user._id,
          game: req.params.id,
          cards: data.cards,
          src: data.src,
          dst: data.dst,
          up: data.up,
        };
        let move = new app.models.Move(newMove);
        await move.save();


        let query = { $inc: { moves: 1 } };
        // Add game movement value
        await app.models.Game.findByIdAndUpdate(req.params.id, query);

        query = { state: result.state };
        // Add game movement value
        await app.models.Game.findByIdAndUpdate(req.params.id, query);

        res.status(201).send({ ok: "ok" });
      } catch (err) {
        console.log(`Move.create move failure: ${err}`);
        res.status(400).send({ error: "failure creating movement" });
        // Much more error management needs to happen here
      }
    }
  });

  // Provide end-point to request shuffled deck of cards and initial state - for testing
  app.get("/v1/cards/shuffle", (req, res) => {
    res.send(shuffleCards(false));
  });
  app.get("/v1/cards/initial", (req, res) => {
    res.send(initialState());
  });
};
