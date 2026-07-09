/* ============================================================
   Tiny Arduino-subset C/C++ interpreter.
   Supports: setup()/loop(), int/float/bool/double/char/String/long/byte/unsigned
   var decls, if/else, for, while, blocks, assignment (=, +=, -=, *=, /=),
   ++/-- (pre/post), binary/unary/logical ops, function calls to:
     pinMode, digitalWrite, digitalRead, analogRead, analogWrite,
     delay, delayMicroseconds, millis, Serial.begin, Serial.print,
     Serial.println, random, map, constrain, min, max, abs
   Constants: HIGH, LOW, OUTPUT, INPUT, INPUT_PULLUP, A0-A5, LED_BUILTIN, true, false
   No user-defined functions beyond setup/loop (v1 scope), no arrays/structs/pointers.
   ============================================================ */

// ---------- Tokenizer ----------
const KEYWORDS = new Set([
  'void','int','float','double','bool','boolean','char','byte','long','unsigned','const','String',
  'if','else','for','while','return','true','false','break','continue'
]);

function tokenize(src) {
  // strip comments
  src = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  // strip preprocessor lines
  src = src.replace(/^\s*#.*$/gm, '');
  const tokens = [];
  let i = 0;
  const n = src.length;
  const isDigit = c => c >= '0' && c <= '9';
  const isIdentStart = c => /[A-Za-z_]/.test(c);
  const isIdentPart = c => /[A-Za-z0-9_]/.test(c);

  while (i < n) {
    const c = src[i];
    if (c === ' ' || c === '\t' || c === '\r' || c === '\n') { i++; continue; }
    if (c === '"') {
      let j = i + 1, s = '';
      while (j < n && src[j] !== '"') {
        if (src[j] === '\\' && j + 1 < n) { s += src[j + 1]; j += 2; }
        else { s += src[j]; j++; }
      }
      tokens.push({ type: 'string', value: s, line: lineOf(src, i) });
      i = j + 1;
      continue;
    }
    if (c === "'") {
      let j = i + 1, s = '';
      while (j < n && src[j] !== "'") {
        if (src[j] === '\\' && j + 1 < n) { s += src[j + 1]; j += 2; }
        else { s += src[j]; j++; }
      }
      tokens.push({ type: 'number', value: s.charCodeAt(0), line: lineOf(src, i) });
      i = j + 1;
      continue;
    }
    if (isDigit(c) || (c === '.' && isDigit(src[i + 1]))) {
      let j = i, s = '';
      while (j < n && (isDigit(src[j]) || src[j] === '.')) { s += src[j]; j++; }
      tokens.push({ type: 'number', value: parseFloat(s), line: lineOf(src, i) });
      i = j;
      continue;
    }
    if (isIdentStart(c)) {
      let j = i, s = '';
      while (j < n && isIdentPart(src[j])) { s += src[j]; j++; }
      tokens.push({ type: KEYWORDS.has(s) ? 'keyword' : 'ident', value: s, line: lineOf(src, i) });
      i = j;
      continue;
    }
    // multi-char operators
    const three = src.slice(i, i + 3);
    const two = src.slice(i, i + 2);
    if (['<<=', '>>='].includes(three)) { tokens.push({ type: 'op', value: three, line: lineOf(src,i) }); i += 3; continue; }
    if (['==','!=','<=','>=','&&','||','++','--','+=','-=','*=','/=','%='].includes(two)) {
      tokens.push({ type: 'op', value: two, line: lineOf(src, i) }); i += 2; continue;
    }
    if ('+-*/%<>=!&|(){};,.'.includes(c)) {
      tokens.push({ type: 'op', value: c, line: lineOf(src, i) }); i++; continue;
    }
    // unknown char, skip
    i++;
  }
  tokens.push({ type: 'eof', value: null, line: -1 });
  return tokens;
}
function lineOf(src, idx) { return src.slice(0, idx).split('\n').length; }

// ---------- Parser ----------
class ParseError extends Error {}

function parse(tokens) {
  let pos = 0;
  const peek = (o = 0) => tokens[pos + o];
  const at = (type, value) => { const t = peek(); return t.type === type && (value === undefined || t.value === value); };
  const atOp = (v) => at('op', v);
  const atKw = (v) => at('keyword', v);
  function advance() { return tokens[pos++]; }
  function expectOp(v) {
    if (!atOp(v)) throw new ParseError(`Expected '${v}' but got '${peek().value}' on line ${peek().line}`);
    return advance();
  }
  const TYPE_WORDS = new Set(['void','int','float','double','bool','boolean','char','byte','long','unsigned','const','String']);

  function isTypeStart() {
    return (peek().type === 'keyword' && TYPE_WORDS.has(peek().value));
  }
  function consumeType() {
    // consume possibly multiple keyword tokens like "unsigned long"
    let t = advance().value;
    while (peek().type === 'keyword' && TYPE_WORDS.has(peek().value)) t += ' ' + advance().value;
    return t;
  }

  function parseProgram() {
    const decls = [];
    while (!at('eof')) {
      decls.push(parseTopLevel());
    }
    return { type: 'Program', decls };
  }

  function parseTopLevel() {
    if (!isTypeStart()) throw new ParseError(`Unexpected token '${peek().value}' on line ${peek().line}`);
    const retType = consumeType();
    const name = advance().value; // ident
    if (atOp('(')) {
      expectOp('(');
      // params (v1: ignore params, just skip to matching ')')
      let depth = 1;
      while (depth > 0) {
        const t = advance();
        if (t.type === 'op' && t.value === '(') depth++;
        else if (t.type === 'op' && t.value === ')') depth--;
        else if (t.type === 'eof') throw new ParseError('Unexpected EOF in parameter list');
      }
      const body = parseBlock();
      return { type: 'FuncDecl', name, retType, body };
    }
    // global variable declaration(s): retType name [= expr] (, name [= expr])* ;
    const decls = [];
    let init = null;
    if (atOp('=')) { advance(); init = parseExpression(); }
    decls.push({ name, init });
    while (atOp(',')) {
      advance();
      const n2 = advance().value;
      let init2 = null;
      if (atOp('=')) { advance(); init2 = parseExpression(); }
      decls.push({ name: n2, init: init2 });
    }
    expectOp(';');
    return { type: 'VarDecl', varType: retType, decls };
  }

  function parseBlock() {
    expectOp('{');
    const stmts = [];
    while (!atOp('}')) {
      if (at('eof')) throw new ParseError('Unexpected EOF, missing }');
      stmts.push(parseStatement());
    }
    expectOp('}');
    return { type: 'Block', stmts };
  }

  function parseStatement() {
    if (atOp('{')) return parseBlock();
    if (atKw('if')) return parseIf();
    if (atKw('for')) return parseFor();
    if (atKw('while')) return parseWhile();
    if (atKw('break')) { advance(); expectOp(';'); return { type: 'Break' }; }
    if (atKw('continue')) { advance(); expectOp(';'); return { type: 'Continue' }; }
    if (atKw('return')) {
      advance();
      let arg = null;
      if (!atOp(';')) arg = parseExpression();
      expectOp(';');
      return { type: 'Return', arg };
    }
    if (isTypeStart()) return parseVarDecl();
    // expression statement
    const expr = parseExpression();
    expectOp(';');
    return { type: 'ExprStatement', expr };
  }

  function parseVarDecl() {
    const varType = consumeType();
    const decls = [];
    do {
      const name = advance().value;
      let init = null;
      if (atOp('=')) { advance(); init = parseExpression(); }
      decls.push({ name, init });
    } while (atOp(',') && advance());
    expectOp(';');
    return { type: 'VarDecl', varType, decls };
  }

  function parseIf() {
    advance();
    expectOp('(');
    const test = parseExpression();
    expectOp(')');
    const cons = parseStatement();
    let alt = null;
    if (atKw('else')) { advance(); alt = parseStatement(); }
    return { type: 'If', test, cons, alt };
  }

  function parseFor() {
    advance();
    expectOp('(');
    let init = null;
    if (!atOp(';')) {
      init = isTypeStart() ? parseVarDeclNoSemi() : { type: 'ExprStatement', expr: parseExpression() };
    }
    expectOp(';');
    let test = null;
    if (!atOp(';')) test = parseExpression();
    expectOp(';');
    let update = null;
    if (!atOp(')')) update = parseExpression();
    expectOp(')');
    const body = parseStatement();
    return { type: 'For', init, test, update, body };
  }
  function parseVarDeclNoSemi() {
    const varType = consumeType();
    const decls = [];
    do {
      const name = advance().value;
      let init = null;
      if (atOp('=')) { advance(); init = parseExpression(); }
      decls.push({ name, init });
    } while (atOp(',') && advance());
    return { type: 'VarDecl', varType, decls };
  }

  function parseWhile() {
    advance();
    expectOp('(');
    const test = parseExpression();
    expectOp(')');
    const body = parseStatement();
    return { type: 'While', test, body };
  }

  // Expression parsing (precedence climbing)
  function parseExpression() { return parseAssignment(); }

  function parseAssignment() {
    const left = parseLogicalOr();
    if (atOp('=') || atOp('+=') || atOp('-=') || atOp('*=') || atOp('/=') || atOp('%=')) {
      const op = advance().value;
      const right = parseAssignment();
      return { type: 'Assign', op, left, right };
    }
    return left;
  }
  function parseLogicalOr() {
    let left = parseLogicalAnd();
    while (atOp('||')) { advance(); left = { type: 'Logical', op: '||', left, right: parseLogicalAnd() }; }
    return left;
  }
  function parseLogicalAnd() {
    let left = parseEquality();
    while (atOp('&&')) { advance(); left = { type: 'Logical', op: '&&', left, right: parseEquality() }; }
    return left;
  }
  function parseEquality() {
    let left = parseRelational();
    while (atOp('==') || atOp('!=')) { const op = advance().value; left = { type: 'Binary', op, left, right: parseRelational() }; }
    return left;
  }
  function parseRelational() {
    let left = parseAdditive();
    while (atOp('<') || atOp('>') || atOp('<=') || atOp('>=')) { const op = advance().value; left = { type: 'Binary', op, left, right: parseAdditive() }; }
    return left;
  }
  function parseAdditive() {
    let left = parseMultiplicative();
    while (atOp('+') || atOp('-')) { const op = advance().value; left = { type: 'Binary', op, left, right: parseMultiplicative() }; }
    return left;
  }
  function parseMultiplicative() {
    let left = parseUnary();
    while (atOp('*') || atOp('/') || atOp('%')) { const op = advance().value; left = { type: 'Binary', op, left, right: parseUnary() }; }
    return left;
  }
  function parseUnary() {
    if (atOp('!') || atOp('-') || atOp('+')) { const op = advance().value; return { type: 'Unary', op, arg: parseUnary() }; }
    if (atOp('++') || atOp('--')) { const op = advance().value; const arg = parseUnary(); return { type: 'Update', op, arg, prefix: true }; }
    return parsePostfix();
  }
  function parsePostfix() {
    let e = parseCallOrMember();
    if (atOp('++') || atOp('--')) { const op = advance().value; e = { type: 'Update', op, arg: e, prefix: false }; }
    return e;
  }
  function parseCallOrMember() {
    let e = parsePrimary();
    for (;;) {
      if (atOp('.')) {
        advance();
        const prop = advance().value;
        e = { type: 'Member', object: e, property: prop };
      } else if (atOp('(')) {
        advance();
        const args = [];
        if (!atOp(')')) {
          args.push(parseExpression());
          while (atOp(',')) { advance(); args.push(parseExpression()); }
        }
        expectOp(')');
        e = { type: 'Call', callee: e, args };
      } else break;
    }
    return e;
  }
  function parsePrimary() {
    const t = peek();
    if (t.type === 'number') { advance(); return { type: 'Num', value: t.value }; }
    if (t.type === 'string') { advance(); return { type: 'Str', value: t.value }; }
    if (t.type === 'keyword' && (t.value === 'true' || t.value === 'false')) { advance(); return { type: 'Bool', value: t.value === 'true' }; }
    if (t.type === 'ident') { advance(); return { type: 'Ident', name: t.value }; }
    if (atOp('(')) { advance(); const e = parseExpression(); expectOp(')'); return e; }
    throw new ParseError(`Unexpected token '${t.value}' on line ${t.line}`);
  }

  return parseProgram();
}

// ---------- Interpreter ----------
class RuntimeSignal { constructor(kind) { this.kind = kind; } }
const BREAK = new RuntimeSignal('break');
const CONTINUE = new RuntimeSignal('continue');

class Interpreter {
  constructor(ast, hardware) {
    this.ast = ast;
    this.hw = hardware;
    this.globals = Object.create(null);
    this.setupFunc = null;
    this.loopFunc = null;
    this.stepBudget = 0;
    this.MAX_STEPS_BETWEEN_YIELDS = 200000;
    this._installConstants();
    for (const d of ast.decls) {
      if (d.name === 'setup') this.setupFunc = d;
      else if (d.name === 'loop') this.loopFunc = d;
    }
    if (!this.setupFunc) throw new Error('No setup() function found.');
    if (!this.loopFunc) throw new Error('No loop() function found.');
  }
  _installConstants() {
    Object.assign(this.globals, {
      HIGH: 1, LOW: 0, OUTPUT: 'OUTPUT', INPUT: 'INPUT', INPUT_PULLUP: 'INPUT_PULLUP',
      LED_BUILTIN: 13, A0: 14, A1: 15, A2: 16, A3: 17, A4: 18, A5: 19,
      true: true, false: false
    });
  }

  // Runs the top-level global var decls (those outside setup/loop), once.
  *runGlobals(scope) {
    for (const d of this.ast.decls) {
      if (d.type === 'VarDecl') yield* this.execStatement(d, scope);
    }
  }

  *execFunc(func, scope) {
    yield* this.execStatement(func.body, scope);
  }

  *execStatement(node, scope) {
    this.stepBudget++;
    if (this.stepBudget > this.MAX_STEPS_BETWEEN_YIELDS) {
      throw new Error('Possible infinite loop without delay() — execution stopped.');
    }
    switch (node.type) {
      case 'Block': {
        const inner = Object.create(scope);
        for (const s of node.stmts) {
          const sig = yield* this.execStatement(s, inner);
          if (sig) return sig;
        }
        return null;
      }
      case 'VarDecl': {
        const isIntType = /\b(int|long|byte|unsigned)\b/.test(node.varType);
        for (const d of node.decls) {
          let val = d.init ? yield* this.evalExpr(d.init, scope) : (node.varType === 'String' ? '' : 0);
          if (isIntType && typeof val === 'number') val = Math.trunc(val);
          scope[d.name] = val;
          this._declareLocal(scope, d.name);
        }
        return null;
      }
      case 'ExprStatement': {
        yield* this.evalExpr(node.expr, scope);
        return null;
      }
      case 'If': {
        const test = yield* this.evalExpr(node.test, scope);
        if (truthy(test)) return yield* this.execStatement(node.cons, scope);
        else if (node.alt) return yield* this.execStatement(node.alt, scope);
        return null;
      }
      case 'While': {
        while (truthy(yield* this.evalExpr(node.test, scope))) {
          const sig = yield* this.execStatement(node.body, scope);
          if (sig === BREAK) break;
          if (sig && sig !== CONTINUE) return sig;
        }
        return null;
      }
      case 'For': {
        const forScope = Object.create(scope);
        if (node.init) yield* this.execStatement(node.init.type === 'VarDecl' ? node.init : { type: 'ExprStatement', expr: node.init.expr }, forScope);
        while (node.test ? truthy(yield* this.evalExpr(node.test, forScope)) : true) {
          const sig = yield* this.execStatement(node.body, forScope);
          if (sig === BREAK) break;
          if (sig && sig !== CONTINUE) return sig;
          if (node.update) yield* this.evalExpr(node.update, forScope);
        }
        return null;
      }
      case 'Break': return BREAK;
      case 'Continue': return CONTINUE;
      case 'Return': return new RuntimeSignal('return');
      default:
        throw new Error('Unknown statement type: ' + node.type);
    }
  }

  _declareLocal(scope, name) {
    if (!scope.__locals) Object.defineProperty(scope, '__locals', { value: new Set(), enumerable: false });
    scope.__locals.add(name);
  }

  _findOwner(scope, name) {
    let s = scope;
    while (s) {
      if (Object.prototype.hasOwnProperty.call(s, name)) return s;
      s = Object.getPrototypeOf(s);
    }
    return null;
  }

  *evalExpr(node, scope) {
    switch (node.type) {
      case 'Num': return node.value;
      case 'Str': return node.value;
      case 'Bool': return node.value;
      case 'Ident': {
        const owner = this._findOwner(scope, node.name);
        if (owner) return owner[node.name];
        if (node.name in this.globals) return this.globals[node.name];
        throw new Error(`Unknown identifier '${node.name}'`);
      }
      case 'Assign': {
        const val = yield* this.evalExpr(node.right, scope);
        return this._assign(node, scope, val);
      }
      case 'Update': {
        const cur = yield* this.evalExpr(node.arg, scope);
        const next = node.op === '++' ? cur + 1 : cur - 1;
        this._setIdent(node.arg, scope, next);
        return node.prefix ? next : cur;
      }
      case 'Unary': {
        const v = yield* this.evalExpr(node.arg, scope);
        if (node.op === '!') return !truthy(v);
        if (node.op === '-') return -v;
        if (node.op === '+') return +v;
        break;
      }
      case 'Logical': {
        const l = yield* this.evalExpr(node.left, scope);
        if (node.op === '&&') return truthy(l) ? truthy(yield* this.evalExpr(node.right, scope)) : false;
        if (node.op === '||') return truthy(l) ? true : truthy(yield* this.evalExpr(node.right, scope));
        break;
      }
      case 'Binary': {
        const l = yield* this.evalExpr(node.left, scope);
        const r = yield* this.evalExpr(node.right, scope);
        switch (node.op) {
          case '+': return (typeof l === 'string' || typeof r === 'string') ? String(l) + String(r) : l + r;
          case '-': return l - r;
          case '*': return l * r;
          case '/': return l / r;
          case '%': return l % r;
          case '==': return l === r;
          case '!=': return l !== r;
          case '<': return l < r;
          case '>': return l > r;
          case '<=': return l <= r;
          case '>=': return l >= r;
        }
        break;
      }
      case 'Member': {
        // Only Serial.xxx supported as member access producing a bound tag
        if (node.object.type === 'Ident' && node.object.name === 'Serial') {
          return { __serialMethod: node.property };
        }
        throw new Error(`Unsupported member access '${node.property}'`);
      }
      case 'Call': {
        return yield* this.evalCall(node, scope);
      }
      default:
        throw new Error('Unknown expr type: ' + node.type);
    }
  }

  _setIdent(node, scope, val) {
    if (node.type !== 'Ident') throw new Error('Invalid assignment target');
    const owner = this._findOwner(scope, node.name);
    if (owner) { owner[node.name] = val; return val; }
    // implicit global fallback (shouldn't normally happen)
    this.globals[node.name] = val;
    return val;
  }
  _assign(node, scope, rhs) {
    const name = node.left.type === 'Ident' ? node.left.name : null;
    if (!name) throw new Error('Invalid assignment target');
    let val = rhs;
    if (node.op !== '=') {
      const cur = this._findOwner(scope, name) ? this._findOwner(scope, name)[name] : this.globals[name];
      switch (node.op) {
        case '+=': val = cur + rhs; break;
        case '-=': val = cur - rhs; break;
        case '*=': val = cur * rhs; break;
        case '/=': val = cur / rhs; break;
        case '%=': val = cur % rhs; break;
      }
    }
    return this._setIdent(node.left, scope, val);
  }

  *evalCall(node, scope) {
    // Serial.print / Serial.println
    if (node.callee.type === 'Member' && node.callee.object.type === 'Ident' && node.callee.object.name === 'Serial') {
      const method = node.callee.property;
      const args = [];
      for (const a of node.args) args.push(yield* this.evalExpr(a, scope));
      if (method === 'begin') return null;
      if (method === 'print') { this.hw.print(String(args[0] ?? '')); return null; }
      if (method === 'println') { this.hw.println(String(args[0] ?? '')); return null; }
      throw new Error(`Unsupported Serial.${method}()`);
    }
    if (node.callee.type !== 'Ident') throw new Error('Unsupported call target');
    const name = node.callee.name;
    const args = [];
    for (const a of node.args) args.push(yield* this.evalExpr(a, scope));

    switch (name) {
      case 'pinMode': this.hw.pinMode(args[0], args[1]); return null;
      case 'digitalWrite': this.hw.digitalWrite(args[0], args[1]); return null;
      case 'digitalRead': return this.hw.digitalRead(args[0]);
      case 'analogRead': return this.hw.analogRead(args[0]);
      case 'analogWrite': this.hw.analogWrite(args[0], args[1]); return null;
      case 'delay': yield { type: 'delay', ms: args[0] }; return null;
      case 'delayMicroseconds': yield { type: 'delay', ms: args[0] / 1000 }; return null;
      case 'millis': return this.hw.millis();
      case 'random': return args.length >= 2 ? Math.floor(Math.random() * (args[1] - args[0])) + args[0] : Math.floor(Math.random() * args[0]);
      case 'map': {
        const [x, inMin, inMax, outMin, outMax] = args;
        return (x - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
      }
      case 'constrain': return Math.min(Math.max(args[0], args[1]), args[2]);
      case 'min': return Math.min(args[0], args[1]);
      case 'max': return Math.max(args[0], args[1]);
      case 'abs': return Math.abs(args[0]);
      default:
        throw new Error(`Unknown function '${name}()'`);
    }
  }
}

function truthy(v) { return v === true ? true : v === false ? false : !!v; }

// Public API: compile + create a driver
function compileSketch(src) {
  const tokens = tokenize(src);
  const ast = parse(tokens);
  return ast;
}

const ArduinoSim = { tokenize, parse, Interpreter, compileSketch, RuntimeSignal };
if (typeof module !== 'undefined' && module.exports) { module.exports = ArduinoSim; }
if (typeof window !== 'undefined') { window.ArduinoSim = ArduinoSim; }
