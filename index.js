const { menubar } = require("menubar");
const { exec } = require("child_process");
const { Menu } = require("electron");

const UPDATE_INTERVAL = 10000;

const mb = menubar({
  tooltip: "Remaining battery",
});

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
  try {
    const remainingTime = await getRemainingTime();
    mb.tray.setTitle(remainingTime);
  } catch (e) {}
}

function startMonitoring() {
  return setInterval(() => {
    updateValue();
  }, UPDATE_INTERVAL);
}

function stopMonitoring(intervalId) {
  clearInterval(intervalId);
}

mb.on("ready", () => {
  const { powerMonitor } = require("electron");
  overrideClick();
  setRightClickMenu();
  updateValue(); // Init the remaining time
  let intervalId = startMonitoring();
  powerMonitor.on('suspend', () => {
    stopMonitoring(intervalId);
  });
  powerMonitor.on('resume', () => {
    updateValue();
    intervalId = startMonitoring();
  });
});
