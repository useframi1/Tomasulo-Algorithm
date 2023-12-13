'use strict';

// Global variables
var Cycles = 0;
var RS = [];
var inst_Q = JSON.parse(localStorage.getItem('instructions'));
var startingAddress = localStorage.getItem('startingAddress');
var issuedInstructions = [];
var writtingQueue = [];
var dataValues = JSON.parse(localStorage.getItem('dataValues'));
var DataMem = new Array(64000);
var RegStat = new Array(8);
var RegFile = [0, 1, 2, 3, 4, 5, 6, 7]; //dummy
var head = 0; //marking head of instruction queue to ensure single issue
var branchFlag = false;
var jumpFlag = 0;
var waitingForRS = false;
var branchesTaken = 0;
var branchesExecuted = 0;
var branchMisPrediction = 0;
var programHasFinished = false;
var instructionsExecuted = 0;
var IPC = 0;
var stepButton = document.getElementsByClassName('step_btn')[0];
var restartButton = document.getElementsByClassName('restart_btn')[0];
var tracingTable = document.getElementById('tracing_table');
var reservationsTable = document.getElementById('reservation_table');
var registerStatTable = document.getElementById('reg_status');
var registerFileTable = document.getElementById('reg_file');
var dataMemTable = document.getElementById('data_mem');
var instMemTable = document.getElementById('inst_mem');
var branchMisPredictionText =
  document.getElementsByClassName('misprediction')[0];
var IPCtext = document.getElementsByClassName('ipc')[0];
var cyclesText = document.getElementsByClassName('cycle')[0];
var tracingTableCont = document.getElementById('container_tracing_table');
var dataMemTableCont = document.getElementById('container_data_mem');
var instMemTableCont = document.getElementById('container_inst_mem');

var TracingTableObserver = new MutationObserver(function () {
  tracingTableCont.scrollTop = tracingTableCont.scrollHeight;
});

TracingTableObserver.observe(tracingTableCont, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
});

var DataMemTableObserver = new MutationObserver(function () {
  dataMemTableCont.scrollTop = dataMemTableCont.scrollHeight;
});

DataMemTableObserver.observe(dataMemTableCont, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
});

var InstMemTableObserver = new MutationObserver(function () {
  instMemTableCont.scrollTop = instMemTableCont.scrollHeight;
});

InstMemTableObserver.observe(instMemTableCont, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
});

function fillInstMemTable() {
  for (let i = 0; i < inst_Q.length; i++) {
    let newRow = instMemTable.insertRow(-1);

    let inst = newRow.insertCell(0);

    inst.innerHTML = inst_Q[i].inst;
  }
}

function updateTracingTable() {
  var rows = tracingTable.rows.length;
  for (let i = rows - 1; i > 0; i--) {
    tracingTable.deleteRow(i);
  }

  for (let i = 0; i < issuedInstructions.length; i++) {
    let newRow = tracingTable.insertRow(-1);

    let inst = newRow.insertCell(0);
    inst.innerHTML = issuedInstructions[i].inst;

    var issuedCell = newRow.insertCell(1);
    issuedCell.innerHTML = issuedInstructions[i].flushed
      ? 'flushed'
      : issuedInstructions[i].issued;

    var startExecCell = newRow.insertCell(2);
    startExecCell.innerHTML = issuedInstructions[i].flushed
      ? 'flushed'
      : issuedInstructions[i].startExec;

    var executedCell = newRow.insertCell(3);
    executedCell.innerHTML = issuedInstructions[i].flushed
      ? 'flushed'
      : issuedInstructions[i].executed;

    var writeCell = newRow.insertCell(4);
    writeCell.innerHTML = issuedInstructions[i].flushed
      ? 'flushed'
      : issuedInstructions[i].written;
  }
}

function updateReservationsTable() {
  for (let i = 0; i < issuedInstructions.length; i++) {
    var busyCell =
      reservationsTable.rows[issuedInstructions[i].RS_Index + 1].cells[1];
    busyCell.innerHTML = RS[issuedInstructions[i].RS_Index].Busy ? 'Y' : 'N';

    var opCell =
      reservationsTable.rows[issuedInstructions[i].RS_Index + 1].cells[2];
    opCell.innerHTML = RS[issuedInstructions[i].RS_Index].Op;

    var vjCell =
      reservationsTable.rows[issuedInstructions[i].RS_Index + 1].cells[3];
    vjCell.innerHTML = RS[issuedInstructions[i].RS_Index].Vj;

    var vkCell =
      reservationsTable.rows[issuedInstructions[i].RS_Index + 1].cells[4];
    vkCell.innerHTML = RS[issuedInstructions[i].RS_Index].Vk;

    var qjCell =
      reservationsTable.rows[issuedInstructions[i].RS_Index + 1].cells[5];
    qjCell.innerHTML = RS[issuedInstructions[i].RS_Index].Qj;

    var qkCell =
      reservationsTable.rows[issuedInstructions[i].RS_Index + 1].cells[6];
    qkCell.innerHTML = RS[issuedInstructions[i].RS_Index].Qk;

    var aCell =
      reservationsTable.rows[issuedInstructions[i].RS_Index + 1].cells[7];
    aCell.innerHTML = RS[issuedInstructions[i].RS_Index].A;
  }
}

function updateRegisterStatTable() {
  for (let i = 0; i < issuedInstructions.length; i++) {
    if (
      issuedInstructions[i].Op != 'bne' &&
      issuedInstructions[i].Op != 'return' &&
      issuedInstructions[i].Op != 'store'
    ) {
      var qiCell =
        registerStatTable.rows[1].cells[issuedInstructions[i].rA + 1];
      qiCell.innerHTML = RS[issuedInstructions[i].RS_Index].Busy
        ? RS[issuedInstructions[i].RS_Index].Name
        : null;
    }
  }
}

function updateRegisterFileTable() {
  for (let i = 0; i < 8; i++) {
    var cell = registerFileTable.rows[1].cells[i + 1];
    cell.innerHTML = RegFile[i];
  }
}

function updateDataMemoryTable(initialize) {
  if (initialize) {
    DataMem = new Array(64000);

    for (let i = 0; i < dataValues.length; i++) {
      DataMem[dataValues[i].address] = parseInt(dataValues[i].value);
    }
  }

  for (let i = 0; i < 5; i++) {
    console.log(i + ' = ' + DataMem[i]);
  }
  var rowCount = dataMemTable.rows.length;
  for (let i = rowCount - 1; i > 0; i--) {
    dataMemTable.deleteRow(i);
  }

  if (initialize) {
    for (let i = 0; i < dataValues.length; i++) {
      let newRow = dataMemTable.insertRow(-1);

      let address = newRow.insertCell(0);
      let value = newRow.insertCell(1);

      address.innerHTML = dataValues[i].address;
      value.innerHTML = dataValues[i].value;
    }
  } else {
    for (let i = 0; i < DataMem.length; i++) {
      if (DataMem[i] != null) {
        let newRow = dataMemTable.insertRow(-1);

        let address = newRow.insertCell(0);
        let value = newRow.insertCell(1);

        address.innerHTML = i;
        value.innerHTML = DataMem[i];
      }
    }
  }
}

fillInstMemTable();
updateTracingTable();
updateRegisterFileTable();
updateDataMemoryTable(true);

class Instruction {
  constructor(
    inst,
    op,
    rA,
    rB,
    rC,
    offset,
    imm,
    issued,
    startExec,
    executed,
    written,
    cyclesForExecution,
    cyclesSinceExecution,
    RS_Index,
    addr,
    flushed,
    jump,
    skipped
  ) {
    this.inst = inst;
    this.Op = op;
    this.rA = rA;
    this.rB = rB;
    this.rC = rC;
    this.offset = offset;
    this.imm = imm;
    this.issued = issued;
    this.startExec = startExec;
    this.executed = executed;
    this.written = written;
    this.C_Needed = cyclesForExecution;
    this.C_Exec = cyclesSinceExecution;
    this.RS_Index = RS_Index;
    this.address = addr;
    this.flushed = flushed;
    this.jump = jump;
    this.skipped = skipped;
  }
}

// Reservation Station
class RS_type {
  constructor(Name, Busy, Op, Vj, Vk, Qj, Qk, A) {
    this.Name = Name;
    this.Busy = Busy;
    this.Op = Op;
    this.Vj = Vj;
    this.Vk = Vk;
    this.Qj = Qj;
    this.Qk = Qk;
    this.A = A;
  }
}

// Initializing reservation station
var row = new RS_type('LOAD1', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('LOAD2', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('STORE1', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('STORE2', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('BNE', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('CALL/RETURN', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('ADD/ADDI1', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('ADD/ADDI2', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('ADD/ADDI3', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('NAND', false, null, null, null, null, null, null);
RS.push(row);
row = new RS_type('DIV', false, null, null, null, null, null, null);
RS.push(row);

function CheckRSEmpty() {
  var Can_Issue = false;
  var index;
  for (let i = 0; i < RS.length; i++) {
    if (
      RS[i].Name != null &&
      RS[i].Name.toLowerCase().includes(inst_Q[head].Op) &&
      !RS[i].Busy
    ) {
      Can_Issue = true;
      index = i;
      break;
    }
  }
  if (!Can_Issue) index = -1;
  return index;
}

function R_Issue(index) {
  if (RegStat[inst_Q[head].rB] != null && inst_Q[head].rB != 0) {
    RS[index].Qj = RegStat[inst_Q[head].rB];
  } else {
    RS[index].Vj = RegFile[inst_Q[head].rB];
    RS[index].Qj = null;
  }
  if (RegStat[inst_Q[head].rC] != null && inst_Q[head].rC != 0) {
    RS[index].Qk = RegStat[inst_Q[head].rC];
  } else {
    RS[index].Vk = RegFile[inst_Q[head].rC];
    RS[index].Qk = null;
  }
  RegStat[inst_Q[head].rA] = RS[index].Name;
}

function L_Issue(index) {
  if (RegStat[inst_Q[head].rB] != null && inst_Q[head].rB != 0) {
    RS[index].Qj = RegStat[inst_Q[head].rB];
  } else {
    RS[index].Vj = RegFile[inst_Q[head].rB];
    RS[index].Qj = null;
  }
  RS[index].A = inst_Q[head].offset;
  RegStat[inst_Q[head].rA] = RS[index].Name;
}

function S_Issue(index) {
  if (RegStat[inst_Q[head].rA] != null && inst_Q[head].rA != 0) {
    RS[index].Qj = RegStat[inst_Q[head].rA];
  } else {
    RS[index].Vj = RegFile[inst_Q[head].rA];
    RS[index].Qj = null; //Up to reconsideration
  }
  if (RegStat[inst_Q[head].rB] != null && inst_Q[head].rB != 0) {
    RS[index].Qk = RegStat[inst_Q[head].rB];
  } else {
    RS[index].Vk = RegFile[inst_Q[head].rB];
    RS[index].Qk = null;
  }
  RS[index].A = inst_Q[head].offset;
}

function I_Issue(index) {
  if (RegStat[inst_Q[head].rB] != null && inst_Q[head].rB != 0) {
    RS[index].Qj = RegStat[inst_Q[head].rB];
  } else {
    RS[index].Vj = RegFile[inst_Q[head].rB];
    RS[index].Qj = null;
  }
  RegStat[inst_Q[head].rA] = RS[index].Name;
}

function B_Issue(index) {
  if (RegStat[inst_Q[head].rA] != null && inst_Q[head].rA != 0) {
    RS[index].Qj = RegStat[inst_Q[head].rA];
  } else {
    RS[index].Vj = RegFile[inst_Q[head].rA];
    RS[index].Qj = null;
  }
  if (RegStat[inst_Q[head].rB] != null && inst_Q[head].rB != 0) {
    RS[index].Qk = RegStat[inst_Q[head].rB];
  } else {
    RS[index].Vk = RegFile[inst_Q[head].rB];
    RS[index].Qk = null;
  }
  RS[index].A = inst_Q[head].offset;
}

function Call_Issue(index) {
  RS[index].A = inst_Q[head].offset;
  jumpFlag = 1;
  if (head < RS[index].A) {
    if (head + 2 < inst_Q.length) {
      inst_Q[head + 1].skipped = true;
      inst_Q[head + 2].skipped = true;
    } else if (head + 1 < inst_Q.length) inst_Q[head + 1].skipped = true;
  }
  RegStat[1] = RS[index].Name;
}

function Ret_Issue(index) {
  if (RegStat[1] != null) {
    RS[index].Qj = RegStat[1];
  } else {
    RS[index].Vj = RegFile[1];
    RS[index].Qj = null;
    jumpFlag = 1;
    if (head < RS[index].A) {
      if (head + 2 < inst_Q.length) {
        inst_Q[head + 1].skipped = true;
        inst_Q[head + 2].skipped = true;
      } else if (head + 1 < inst_Q.length) inst_Q[head + 1].skipped = true;
    }
  }
}

function ISSUE() {
  var index = CheckRSEmpty();

  if (index != -1) {
    waitingForRS = false;
    if (
      inst_Q[head].Op == 'add' ||
      inst_Q[head].Op == 'div' ||
      inst_Q[head].Op == 'nand'
    ) {
      R_Issue(index);
    } else if (inst_Q[head].Op == 'load') {
      L_Issue(index);
    } else if (inst_Q[head].Op == 'store') {
      S_Issue(index);
    } else if (inst_Q[head].Op == 'addi') {
      I_Issue(index);
    } else if (inst_Q[head].Op == 'bne') {
      B_Issue(index);
    } else if (inst_Q[head].Op == 'call') {
      Call_Issue(index);
    } else if (inst_Q[head].Op == 'return') {
      Ret_Issue(index);
    }
    RS[index].Busy = true;
    RS[index].Op = inst_Q[head].Op.toUpperCase();
    inst_Q[head].issued = Cycles;
    inst_Q[head].RS_Index = index; //Saves RS index
    inst_Q[head].skipped = false;
    issuedInstructions.push(
      new Instruction(
        inst_Q[head].inst,
        inst_Q[head].Op,
        inst_Q[head].rA,
        inst_Q[head].rB,
        inst_Q[head].rC,
        inst_Q[head].offset,
        inst_Q[head].imm,
        Cycles,
        null,
        null,
        null,
        inst_Q[head].C_Needed,
        0,
        index,
        inst_Q[head].address,
        false,
        false,
        false
      )
    );

    head++; //pops out of issuing queue
  } else {
    waitingForRS = true;
    console.log('No RS Available: ', inst_Q[head].Op, ' not issued');
  }
}

function EXECUTE(inst) {
  var index = inst.RS_Index;
  var i = 0;
  if (issuedInstructions.length > 0) {
    if (inst.issued < Cycles && !inst.flushed) {
      if (inst.Op == 'add' || inst.Op == 'div' || inst.Op == 'nand') {
        if (RS[index].Qj == null && RS[index].Qk == null) {
          if (inst.C_Needed == 1 && inst.executed == null) {
            inst.startExec = Cycles;
            inst.executed = Cycles;
            writtingQueue.push(inst);
            instructionsExecuted++;
          } else {
            if (inst.C_Exec < inst.C_Needed - 1) {
              if (inst.C_Exec == 0) inst.startExec = Cycles;
              inst.C_Exec++;
            } else if (inst.executed == null) {
              inst.executed = Cycles;
              writtingQueue.push(inst);
              instructionsExecuted++;
            }
          }
        }
      }
      if (inst.Op == 'load') {
        if (RS[index].Qj == null && inst.C_Exec < inst.C_Needed - 1) {
          if (Cycles == inst.issued + 1)
            RS[index].A = RS[index].A + RS[index].Vj; //compute address
          if (inst.C_Exec == 0) inst.startExec = Cycles;
          inst.C_Exec++;
        } else if (RS[index].Qj == null && inst.executed == null) {
          inst.executed = Cycles;
          writtingQueue.push(inst);
          instructionsExecuted++;
        }
      }
      if (inst.Op == 'store') {
        if (RS[index].Qj == null && inst.C_Exec < inst.C_Needed - 1) {
          if (Cycles == inst.issued + 1)
            RS[index].A = RS[index].A + RS[index].Vk; //compute address
          if (inst.C_Exec == 0) inst.startExec = Cycles;
          inst.C_Exec++;
        } else if (RS[index].Qk == null && inst.executed == null) {
          inst.executed = Cycles;
          writtingQueue.push(inst);
          instructionsExecuted++;
        }
      }
      if (inst.Op == 'addi') {
        if (RS[index].Qj == null && inst.C_Exec < inst.C_Needed - 1) {
          if (inst.C_Exec == 0) inst.startExec = Cycles;
          inst.C_Exec++;
        } else if (RS[index].Qj == null && inst.executed == null) {
          inst.executed = Cycles;
          writtingQueue.push(inst);
          instructionsExecuted++;
        }
      }
      if (inst.Op == 'return') {
        if (inst.executed == null && RS[index].Qj == null) {
          inst.startExec = Cycles;
          inst.executed = Cycles;
          writtingQueue.push(inst);
          instructionsExecuted++;
        }
      }
      if (inst.Op == 'call') {
        if (inst.executed == null) {
          inst.startExec = Cycles;
          inst.executed = Cycles;
          writtingQueue.push(inst);
          instructionsExecuted++;
        }
        if (inst.C_Exec < inst.C_Needed - 1) {
          if (inst.C_Exec == 0) inst.startExec = Cycles;
          inst.C_Exec++;
        } else if (inst.executed == null) {
          inst.executed = Cycles;
          writtingQueue.push(inst);
          instructionsExecuted++;
        }
      }
      if (inst.Op == 'bne') {
        if (
          inst.executed == null &&
          RS[index].Qj == null &&
          RS[index].Qk == null
        ) {
          RS[index].A = RS[index].A + inst.address;
          inst.startExec = Cycles;
          inst.executed = Cycles;
          writtingQueue.push(inst);
          instructionsExecuted++;
        }
        // if (
        //   RS[index].Qj == null &&
        //   RS[index].Qk == null &&
        //   inst.C_Exec < inst.C_Needed - 1
        // ) {
        //   if (Cycles == inst.issued + 1)
        //     RS[index].A = RS[index].A + inst.address;
        //   if (inst.C_Exec == 0) inst.startExec = Cycles;
        //   inst.C_Exec++;
        // } else if (
        //   RS[index].Qj == null &&
        //   RS[index].Qk == null &&
        //   inst.executed == null
        // ) {
        //   inst.executed = Cycles;
        //   writtingQueue.push(inst);
        //   branchesExecuted++;
        //   instructionsExecuted++;
        // }
      }
    }
  }
}

function flush(end, op) {
  var start;
  for (let i = 0; i < issuedInstructions.length; i++) {
    if (
      issuedInstructions[i].Op == op &&
      issuedInstructions[i].executed != null &&
      issuedInstructions[i].written == null
    ) {
      start = i;
      break;
    }
  }
  for (let i = start + 1; i < end; i++) {
    if (
      i < issuedInstructions.length &&
      issuedInstructions[i].executed == null &&
      issuedInstructions[i].written == null
    ) {
      RS[issuedInstructions[i].RS_Index].Busy = false;
      RS[issuedInstructions[i].RS_Index].Op = null;
      RS[issuedInstructions[i].RS_Index].Vj = null;
      RS[issuedInstructions[i].RS_Index].Vk = null;
      RS[issuedInstructions[i].RS_Index].Qj = null;
      RS[issuedInstructions[i].RS_Index].Qk = null;
      RS[issuedInstructions[i].RS_Index].A = null;
      for (let j = 0; j < RegStat.length; j++) {
        if (RegStat[j] == RS[issuedInstructions[i].RS_Index].Name) {
          RegStat[j] = null;
        }
      }

      updateUI();
      issuedInstructions[i].flushed = true;
      if (
        issuedInstructions[i].Op == 'return' ||
        issuedInstructions[i].Op == 'call'
      )
        jumpFlag = 0;
    }
  }
  issuedInstructions[start].jump = true;
}

function WRITE(inst, minIssuedIndex) {
  var index = inst.RS_Index;
  var output = null;
  // check if inst is already executed
  if (issuedInstructions.length > 0) {
    if (
      inst.executed != null &&
      inst.executed < Cycles &&
      inst.written == null
    ) {
      if (inst.Op == 'add' && inst.rA != 0) {
        if (RegStat[inst.rA] == RS[index].Name) {
          RegFile[inst.rA] = RS[index].Vj + RS[index].Vk;
        }
        output = RS[index].Vj + RS[index].Vk;
      } else if (inst.Op == 'nand' && inst.rA != 0) {
        if (RegStat[inst.rA] == RS[index].Name) {
          RegFile[inst.rA] = ~(RS[index].Vj & RS[index].Vk);
        }
        output = ~(RS[index].Vj & RS[index].Vk);
      } else if (inst.Op == 'div' && inst.rA != 0) {
        if (RegStat[inst.rA] == RS[index].Name) {
          RegFile[inst.rA] = parseInt(RS[index].Vj / RS[index].Vk);
        }
        output = parseInt(RS[index].Vj / RS[index].Vk);
      } else if (inst.Op == 'addi' && inst.rA != 0) {
        if (RegStat[inst.rA] == RS[index].Name) {
          RegFile[inst.rA] = RS[index].Vj + inst.imm;
        }
        output = RS[index].Vj + inst.imm;
      } else if (inst.Op == 'load' && inst.rA != 0) {
        if (RegStat[inst.rA] == RS[index].Name) {
          RegFile[inst.rA] =
            DataMem[RS[index].A] == null ? 0 : DataMem[RS[index].A];
        }
        output = DataMem[RS[index].A] == null ? 0 : DataMem[RS[index].A];
      } else if (inst.Op == 'store') {
        DataMem[RS[index].A] = RS[index].Vj;
      } else if (inst.Op == 'bne') {
        if (RS[index].Vj != RS[index].Vk) {
          head = RS[index].A + inst.address + 1;
          branchFlag = true;
          branchesTaken++;

          for (let i = inst.address + 2; i < head; i++) {
            inst_Q[i].skipped = true;
          }

          if (head < inst.address) {
            flush(issuedInstructions.length, 'bne');
          } else {
            flush(head + 1, 'bne');
          }
        }
      } else if (inst.Op == 'call') {
        if (RegStat[1] == RS[index].Name) {
          RegFile[1] = inst.address + 1;
        }
        console.log('starting address = ' + parseInt(startingAddress));
        head = RS[index].A - parseInt(startingAddress);
        jumpFlag = 2;
        output = inst.address + 1;
      } else if (inst.Op == 'return') {
        head = RegFile[1];
        jumpFlag = 2;
      }
    }
  }
  inst.written = Cycles;
  console.log('output = ' + output);
  for (let i = 0; i < RS.length; i++) {
    if (RS[i].Name != RS[index].Name) {
      if (RS[i].Qj == RS[index].Name) {
        RS[i].Vj = output;
        RS[i].Qj = null;
      }
      if (RS[i].Qk == RS[index].Name) {
        RS[i].Vk = output;
        RS[i].Qk = null;
      }
    }
  }

  writtingQueue.splice(minIssuedIndex, 1);
  for (let i = 0; i < RegStat.length; i++) {
    if (RegStat[i] == RS[index].Name) {
      RegStat[i] = null;
    }
  }
}

function computeMetrics() {
  if (branchesExecuted == 0) branchMisPrediction = 0;
  else
    branchMisPrediction = ((branchesTaken / branchesExecuted) * 100).toFixed(2);

  IPC = (instructionsExecuted / Cycles).toFixed(2);

  branchMisPredictionText.textContent =
    'Misprediction = ' + branchMisPrediction + '%';
  branchMisPredictionText.hidden = false;

  IPCtext.textContent = 'IPC = ' + IPC;
  IPCtext.hidden = false;

  cyclesText.style.color = 'green';
  cyclesText.style.fontSize = '30px';

  stepButton.disabled = true;
}

function Main() {
  Cycles++;
  branchFlag = false;
  var minIssued = Infinity;
  var minIssuedIndex = -1;

  for (let i = 0; i < writtingQueue.length; i++) {
    if (writtingQueue[i].issued < minIssued) {
      minIssued = writtingQueue[i].issued;
      minIssuedIndex = i;
    }
  }
  var hasBranch = false;
  for (let i = 0; i < issuedInstructions.length; i++) {
    hasBranch = false;
    for (let j = i - 1; j >= 0; j--) {
      if (
        issuedInstructions[j].Op == 'bne' &&
        issuedInstructions[j].written == null &&
        !issuedInstructions[j].flushed
      ) {
        hasBranch = true;
      }
    }
    if (!hasBranch) EXECUTE(issuedInstructions[i]);
  }

  var RS_Index = -1;

  if (minIssuedIndex != -1) {
    RS_Index = writtingQueue[minIssuedIndex].RS_Index;
    WRITE(writtingQueue[minIssuedIndex], minIssuedIndex);
  }

  console.log(jumpFlag);
  if (!branchFlag && head < inst_Q.length && jumpFlag == 0) {
    ISSUE();
  }

  if (RS_Index != -1) {
    RS[RS_Index].Busy = false;
    RS[RS_Index].Op = null;
    RS[RS_Index].Vj = null;
    RS[RS_Index].Vk = null;
    RS[RS_Index].Qj = null;
    RS[RS_Index].Qk = null;
    RS[RS_Index].A = null;
  }

  if (jumpFlag == 2) jumpFlag = 0;

  updateUI();

  var allWritten = true;
  for (let i = 0; i < issuedInstructions.length; i++) {
    if (
      (issuedInstructions[i].written == null &&
        !issuedInstructions[i].flushed) ||
      issuedInstructions[i].jump
    ) {
      if (issuedInstructions[i].jump) issuedInstructions[i].jump = false;
      allWritten = false;
    }
  }

  for (let i = 0; i < inst_Q.length; i++) {
    if (inst_Q[i].issued == null && !inst_Q[i].skipped) {
      allWritten = false;
      break;
    }
  }

  programHasFinished = (allWritten && !waitingForRS) || head > inst_Q.length;

  if (programHasFinished) {
    computeMetrics();
  }
}

function updateUI() {
  var cyclesText = document.getElementsByClassName('cycle')[0];
  cyclesText.textContent = 'Cycle ' + Cycles;

  // update tracing table
  updateTracingTable();
  // update reservations table
  updateReservationsTable();
  // update register status table
  updateRegisterStatTable();
  // update register file table
  updateRegisterFileTable();
  // update data memory table
  updateDataMemoryTable(false);
}

stepButton.addEventListener('click', function (event) {
  if (event.target) {
    restartButton.disabled = false;
    if (!programHasFinished || Cycles == 0) Main();
  }
});

restartButton.addEventListener('click', function (event) {
  if (event.target) {
    location.reload();
  }
});
