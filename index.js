const { menubar } = require("menubar");
const { exec } = require("child_process");
const { Menu } = require("electron");

const mb = menubar({
  tooltip: "Remaining battery",
});

function sleep(timeMs) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve();
    }, timeMs);
  });
}

function getRemainingTime() {
  return new Promise((resolve, reject) => {
    exec('pmset -g batt|grep remaining|cut -d" " -f1,5', function(
      err,
      stdout,
      stderr
    ) {
      if (stdout) {
        resolve(String(stdout));
      } else {
        reject();
      }
    });
  });
}

function overrideClick() {
  mb.tray._events.click = function() {};
  mb.tray._events["double-click"] = function() {};
}

function setRightClickMenu() {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Quit",
      click: () => {
        mb.app.quit();
      }
    }
  ]);
  mb.tray.on("right-click", () => {
    mb.tray.popUpContextMenu(contextMenu);
  });
}

async function updateValue() {
  const remainingTime = await getRemainingTime();
  mb.tray.setTitle(remainingTime);
  await sleep(10000);
  updateValue();
}

mb.on("ready", () => {
  overrideClick();
  setRightClickMenu();
  updateValue();
});
