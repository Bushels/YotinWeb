// Entry. Gate 1 (Task 1): reproduce today's behaviour exactly — the qualifier logic
// must be evaluated before the legacy site script (main.js reads window.YotinQualifier
// at execution time). ES module side-effect imports run in order, replacing the two
// deferred classic scripts and their manual cache keys.
import '../qualifier-logic.js';
import '../main.js';
