#!/usr/bin/env node

/**
 * ---------------------------------------------------------
 *       (က) Polpetta Chef, he cooks, you test
 * ---------------------------------------------------------
 * @license   Mit Style License
 * @author    Andrea Giammarchi
 * @twitter   WebReflection
 * ---------------------------------------------------------
 * Chef is a non-blocking way to bake one or more polpetta
 * in different folders and different ports at once, e.g.
 *  chef start [polpetta|serverdir] [path] [port]
 *  chef stop [polpetta|serverdir] [path] [port]
 */

var
  keys = Object.keys,
  env = process.env,
  fs = require("fs"),
  path = require("path"),
  spawn = require('child_process').spawn,
  args = resolveArguments(process.argv),
  dbName = path.join(env.HOME, ".chef"),
  program = /^polpetta|serverdir$/.test(args[1]) ?
    RegExp["$&"] : args.splice(1, 0, "polpetta") && args[1]
  ,
  port = findPort(args.slice(2)) || "",
  filteredFolder = args.filter(function (folder, i) {
    return 1 < i && folder != port;
  })[0],
  folder = path.resolve(filteredFolder || process.cwd()),
  dbStringified, db,
  nmsp, domain, child
;

function perform(magic) {
  domain = nmsp[folder] || (nmsp[folder] = {});
  switch (magic) {
    case "stop":
      if (filteredFolder) {
        port ?
          (port in domain) && kill(port) :
          keys(domain).forEach(kill)
        ;
      } else {
        keys(nmsp).forEach(function ($folder) {
          domain = nmsp[folder = $folder];
          keys(domain).forEach(kill);
        });
      }
      keys(nmsp).forEach(clean);
      save();
      break;
    case "start":
      if (folder) {
        fs.watch(dbName).on("change", function () {
          var out = fs.readFileSync(dbName, "utf-8").replace(dbStringified, "");
          console.log(out);
          if (/:\/\/[^:]+:(\d+)\//.test(out.split(/\r\n|\r|\n/)[0])) {
            domain[RegExp.$1] = child.pid;
          }
          this.close();
          save();
        });
        port && perform("stop");
        child = spawn(
          "node", [path.join(__dirname, program)].concat(args.slice(2)), {
          detached: true,
          stdio: ["ignore", fs.openSync(dbName, 'a'), "ignore"]
        });
        if (port) {
          domain[port] = child.pid;
        }
        child.unref();
        break;
      }
    default:
      console.log([
        "chef start [polpetta|serverdir] [path] [port]",
        "chef stop [polpetta|serverdir] [path] [port]"
      ].join("\n"));
      break;
  }
}

function kill(port) {
  if (port in domain) {
    try {
      process.kill(domain[port]);
      console.log(
        "killed " + folder + " on port " + port
      );
    } catch(o_O) {}
    delete domain[port];
  }
}

function clean(key) {
  if (!keys(nmsp[key]).length) {
    delete nmsp[key];
  }
}

function save() {
  fs.writeFileSync(
    dbName, dbStringified = JSON.stringify(db), "utf-8"
  );
}

if (fs.existsSync(dbName)) {
  dbStringified = fs.readFileSync(dbName, "utf-8");
  try {
    db = JSON.parse(dbStringified);
  } catch(o_O) {
    console.warn("ooops, the chef burned something!");
    console.warn(dbStringified);
  }
}

db || save(db = {});
nmsp = db[program] || (db[program] = {});

perform(args[0]);
