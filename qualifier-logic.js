/* Yotin Energy — candidate-well qualifier decision logic.

   Split out of main.js so it can be tested. This file holds only pure
   functions and data: no DOM, no analytics, no rendering. main.js owns all of
   that and consumes this.

   The reason for the split is risk, not tidiness. These 6 questions decide
   what an operator is told about their own well, and the numbers in here are
   real product limits — the 150 °C rating and the ~10% standoff rule both
   trace to specs published elsewhere on the page. A wrong threshold does not
   throw an error or look broken; it quietly gives a confident, wrong answer.
   That is exactly the class of bug tests exist for, and it is why this file is
   covered by test/qualifier-logic.test.js while the rendering is not.

   Loaded as a plain deferred script before main.js, and required directly by
   the Node test runner. It assigns to the global rather than using modules so
   the site keeps its "no framework, no build step" property.
*/
(function (root) {
  "use strict";

  /* Thousands separator for operator-facing metre values. Round half-up first:
     a casing length is entered as a whole number of metres and a threshold
     derived from it should read the same way. */
  function fmtNum(n) {
    return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  /* The standoff rule, isolated because it is the one piece of arithmetic on
     this page that an operator acts on.
     source: Yotin deployment practice — internal rule of thumb, not a published figure.

     The collar needs roughly 10% of the intermediate casing's length of
     standoff above the shoe:
         (shoe depth - pump depth) >= 0.10 x intermediate length
     so the deepest acceptable landing is 0.9 x length. Rounded to the nearest
     10 m because the input is an approximate figure and a threshold like
     "1,347 m" would imply a precision the answer does not have.

     The clamp matters at the shallow end. Rounding to the nearest 10 rounds
     *up* by as much as 5 m, and at the minimum accepted casing length of 50 m
     that lands the threshold on the shoe itself: 45 -> 50. The question would
     then read "shallower or deeper than 50 m?" in a 50 m casing, where
     "deeper" is impossible and the unflagged "shallower" answer covers the
     whole string including a landing at the shoe — precisely the case this
     rule exists to catch. The threshold must always sit at least one display
     step above the shoe. */
  function landingThreshold(intermediateLength) {
    var rounded = Math.round((intermediateLength * 0.9) / 10) * 10;
    return Math.min(rounded, intermediateLength - 10);
  }

  /* Casing-length parsing and bounds. Returns a result object rather than
     throwing or touching the DOM, so the caller decides how to present it and
     the bounds stay testable. */
  function parseCasingLength(text, step) {
    var raw = String(text == null ? "" : text).replace(/[^\d.]/g, "");
    var n = parseFloat(raw);

    if (!isFinite(n) || n <= 0) {
      return { ok: false, reason: "not_a_number", error: "Enter the approximate length in metres." };
    }
    if (n < step.min || n > step.max) {
      return {
        ok: false,
        reason: "out_of_range",
        error: "That looks outside the usual range (" +
          fmtNum(step.min) + "–" + fmtNum(step.max) + " m). Double-check the figure."
      };
    }
    return { ok: true, number: n };
  }

  var STEPS = [
    {
      key: "lift",
      label: "Artificial lift",
      question: "What lifts the well?",
      options: [
        { value: "Progressing cavity pump (PCP)", tag: "Best fit" },
        { value: "Electric submersible pump (ESP)" },
        { value: "Rod pump" },
        { value: "Natural flow or other", flag: "lift" }
      ]
    },
    {
      key: "type",
      label: "Well type",
      question: "What is it producing?",
      options: [
        { value: "Heavy oil" },
        { value: "Light oil" },
        { value: "Gas" },
        { value: "Thermal / SAGD", flag: "thermal" }
      ]
    },
    {
      key: "temp",
      label: "Bottomhole temperature",
      question: "How hot does it get downhole?",
      options: [
        { value: "Under 100 °C" },
        { value: "100 – 150 °C", tag: "At spec" },
        /* `future`, not `flag`: above 150 °C is a waitlist, not a rejection.
           It short-circuits the verdict regardless of anything else. */
        { value: "Above 150 °C", future: true },
        { value: "Not sure", flag: "temp" }
      ]
    },
    {
      /* Asked as a number because the next question is derived from it. The
         standoff rule is a proportion of this length, so a banded answer here
         would make the follow-up threshold meaningless. */
      key: "intermediate",
      type: "number",
      label: "Intermediate casing length",
      question: "How long is your intermediate casing, approximately?",
      unit: "m",
      placeholder: "1000",
      min: 50,
      max: 6000
    },
    {
      /* Where the pump lands decides the deployment method. Landed closer to
         the shoe than the standoff rule allows, WellFi runs outside the
         intermediate instead of inside the tubing. Either comfortably above
         the shoe or below it in open hole works; right at the shoe is the
         awkward case. */
      key: "landing",
      type: "derived",
      label: "Pump landing",
      /* Turning the rule into a single concrete number means the engineer taps
         once instead of doing the arithmetic. */
      build: function (answers) {
        var len = answers.intermediate ? answers.intermediate.number : null;
        if (!len) {
          return {
            question: "Where does the pump land in the intermediate casing?",
            options: [
              { value: "Well above the shoe" },
              { value: "Close to the shoe", flag: "external" },
              { value: "Not sure", flag: "landing" }
            ]
          };
        }
        var threshold = landingThreshold(len);
        return {
          question: "Is the pump landed shallower or deeper than " + fmtNum(threshold) + " m?",
          hint: "That is 10% of your intermediate above the shoe — the standoff we design to for a run inside the tubing.",
          options: [
            { value: "Shallower than " + fmtNum(threshold) + " m", tag: "< " + fmtNum(threshold) },
            { value: "Deeper than " + fmtNum(threshold) + " m", tag: "> " + fmtNum(threshold), flag: "external" },
            { value: "Not sure", flag: "landing" }
          ]
        };
      }
    },
    {
      key: "timing",
      label: "Next planned intervention",
      question: "When is the next pump change or planned intervention?",
      options: [
        { value: "Within 3 months", tag: "Ideal timing" },
        { value: "3 – 12 months" },
        { value: "Nothing scheduled", flag: "timing" },
        { value: "Not sure", flag: "timing" }
      ]
    }
  ];

  // Each note explains WHY something needs review, in the engineer's terms.
  var NOTES = {
    temp: "Bottomhole temperature is the one hard limit — WellFi is rated to 150 °C today, so that number is worth confirming before anything else.",
    // source: Yotin deployment practice — internal rule of thumb, not a published figure.
    external: "Landed that deep, WellFi would be set below the intermediate shoe, in open hole, rather than on the tubing inside casing. It is a supported configuration and it reports just as well — but it changes the install, so it is worth confirming early.",
    landing: "Where the pump sits relative to the intermediate shoe decides whether WellFi runs on the tubing inside casing or is set below the shoe, in open hole. Worth pinning down before the changeout gets scoped.",
    timing: "WellFi can go in on a new completion, a planned changeout, or its own run. The economics are simply strongest when it rides along with work that is already scheduled.",
    lift: "Most deployments so far are on pumped wells. Other lift types are workable but worth walking through.",
    thermal: "Thermal and SAGD wells sit closest to the temperature ceiling, so the operating profile matters more than usual."
  };

  /* Three outcomes, and the order matters: `future` wins over everything.
     Above 150 °C is a real hard limit, so it is reported as "we are building
     that" rather than being averaged in with softer review flags. */
  function assess(answers) {
    var flags = [];
    var future = false;

    STEPS.forEach(function (step) {
      var a = answers[step.key];
      if (!a) return;
      if (a.future) future = true;
      if (a.flag) flags.push(a.flag);
    });

    if (future) return { fit: "future", flags: flags };
    return { fit: flags.length ? "review" : "strong", flags: flags };
  }

  function resultLabel(fit) {
    if (fit === "strong") return "Strong fit";
    if (fit === "review") return "Likely fit — worth a review";
    return "Above 150 °C — waiting on the high-temperature version";
  }

  root.YotinQualifier = {
    STEPS: STEPS,
    NOTES: NOTES,
    EMAIL: "kyle.gronning@yotinenergy.com",
    fmtNum: fmtNum,
    landingThreshold: landingThreshold,
    parseCasingLength: parseCasingLength,
    assess: assess,
    resultLabel: resultLabel
  };
})(typeof globalThis !== "undefined" ? globalThis : this);
