'use strict';

let numOfInstructions = 0;
let nextButton = document.getElementsByClassName('next_btn')[0];
let instructionsDiv = document.getElementsByClassName('instructions')[0];
let rows = instructionsDiv.getElementsByClassName('row');
var main = document.getElementsByTagName('main')[0];
var instSelect = document.getElementsByClassName('inst_type')[0];

window.addEventListener('pageshow', function () {
  instSelect.selectedIndex = 0;
});

var InstructionsObserver = new MutationObserver(function () {
  main.scrollTop = main.scrollHeight;
});

InstructionsObserver.observe(main, {
  childList: true,
  attributes: true,
  characterData: true,
  subtree: true,
});

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

nextButton.addEventListener('click', function (event) {
  if (event.target) {
    let instructions = [];

    for (let index = 0; index < rows.length; index++) {
      if (!rows[index].classList.contains('invalid')) {
        let op = rows[index].getElementsByClassName('inst_type')[0].value;
        console.log(op);
        let rA = parseInt(
          rows[index].getElementsByClassName('inst_field')[0].value
        );
        let rB = parseInt(
          rows[index].getElementsByClassName('inst_field')[1].value
        );
        let rC = parseInt(
          rows[index].getElementsByClassName('inst_field')[2].value
        );
        let offset = parseInt(
          rows[index].getElementsByClassName('inst_field')[3].value
        );
        let imm = parseInt(
          rows[index].getElementsByClassName('inst_field')[4].value
        );
        let cyclesForExecution = 0;
        let inst = '';
        switch (op) {
          case 'load':
            inst = 'LOAD R' + rA + ', ' + offset + '(R' + rB + ')';
            cyclesForExecution = 3;
            break;
          case 'store':
            inst = 'STORE R' + rA + ', ' + offset + '(R' + rB + ')';
            cyclesForExecution = 3;
            break;
          case 'bne':
            inst = 'BNE R' + rA + ', R' + rB + ', ' + offset;
            cyclesForExecution = 1;
            break;
          case 'call':
            inst = 'CALL ' + offset;
            cyclesForExecution = 1;
            break;
          case 'return':
            inst = 'RET';
            cyclesForExecution = 1;
            break;
          case 'nand':
            inst = 'NAND R' + rA + ', R' + rB + ', R' + rC;
            cyclesForExecution = 1;
            break;
          case 'add':
            inst = 'ADD R' + rA + ', R' + rB + ', R' + rC;
            cyclesForExecution = 2;
            break;
          case 'addi':
            inst = 'ADDI R' + rA + ', R' + rB + ', ' + imm;
            cyclesForExecution = 2;
            break;
          case 'div':
            inst = 'DIV R' + rA + ', R' + rB + ', R' + rC;
            cyclesForExecution = 10;
            break;
          default:
            break;
        }

        let instruction = new Instruction(
          inst,
          op,
          rA,
          rB,
          rC,
          offset,
          imm,
          null,
          null,
          null,
          null,
          cyclesForExecution,
          0,
          -1,
          index,
          false,
          null,
          false,
          false
        );

        instructions.push(instruction);
      }
    }

    localStorage.setItem('instructions', JSON.stringify(instructions));
    window.location.href = 'settings.html';
  }
});

instructionsDiv.addEventListener('input', function (event) {
  if (event.target && event.target.classList.contains('inst_type')) {
    let row = event.target.parentElement.parentElement;
    let addButton = row.getElementsByClassName('add_inst_btn')[0];
    let fields = row.getElementsByClassName('inst_field');
    let inst = row.getElementsByClassName('inst')[0];

    for (let index = 0; index < fields.length; index++) {
      fields[index].value = '';
    }

    if (event.target.value === 'load') {
      fields[0].disabled = false;
      fields[1].disabled = false;
      fields[2].disabled = true;
      fields[3].disabled = false;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'LOAD RA, offset(RB)';
    } else if (event.target.value === 'store') {
      fields[0].disabled = false;
      fields[1].disabled = false;
      fields[2].disabled = true;
      fields[3].disabled = false;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'STORE RA, offset(RB)';
    } else if (event.target.value === 'bne') {
      fields[0].disabled = false;
      fields[1].disabled = false;
      fields[2].disabled = true;
      fields[3].disabled = false;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'BNE RA, RB, offset';
    } else if (event.target.value === 'call') {
      fields[0].disabled = true;
      fields[1].disabled = true;
      fields[2].disabled = true;
      fields[3].disabled = false;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'CALL offset';
    } else if (event.target.value === 'return') {
      fields[0].disabled = true;
      fields[1].disabled = true;
      fields[2].disabled = true;
      fields[3].disabled = true;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'RET';
      addButton.disabled = false;
      addButton.style.color = 'white';
    } else if (event.target.value === 'add') {
      fields[0].disabled = false;
      fields[1].disabled = false;
      fields[2].disabled = false;
      fields[3].disabled = true;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'ADD RA, RB, RC';
    } else if (event.target.value === 'addi') {
      fields[0].disabled = false;
      fields[1].disabled = false;
      fields[2].disabled = true;
      fields[3].disabled = true;
      fields[4].disabled = false;
      inst.hidden = false;
      inst.textContent = 'ADDI RA, RB, imm';
    } else if (event.target.value === 'nand') {
      fields[0].disabled = false;
      fields[1].disabled = false;
      fields[2].disabled = false;
      fields[3].disabled = true;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'NAND RA, RB, RC';
    } else if (event.target.value === 'div') {
      fields[0].disabled = false;
      fields[1].disabled = false;
      fields[2].disabled = false;
      fields[3].disabled = true;
      fields[4].disabled = true;
      inst.hidden = false;
      inst.textContent = 'DIV RA, RB, RC';
    }
  } else if (event.target && event.target.classList.contains('inst_field')) {
    let row = event.target.parentElement.parentElement;
    let addButton = row.getElementsByClassName('add_inst_btn')[0];
    if (
      event.target.placeholder === 'RA' ||
      event.target.placeholder === 'RB' ||
      event.target.placeholder === 'RC'
    ) {
      if (
        event.target.value < 0 ||
        event.target.value > 7 ||
        isNaN(event.target.value)
      ) {
        event.target.style.background = 'red';
      } else {
        event.target.style.background = '';
      }
    } else if (
      event.target.placeholder === 'offset' ||
      event.target.placeholder === 'imm'
    ) {
      if (
        event.target.value < -32 ||
        event.target.value > 31 ||
        isNaN(event.target.value)
      ) {
        event.target.style.background = 'red';
      } else {
        event.target.style.background = '';
      }
    }

    let fields = row.getElementsByClassName('inst_field');
    let disable = false;
    for (let index = 0; index < fields.length; index++) {
      if (
        fields[index].style.background === 'red' ||
        (fields[index].value === '' && !fields[index].disabled)
      )
        disable = true;
    }
    addButton.disabled = disable;
    addButton.style.color = disable ? '' : 'white';
  }
});

instructionsDiv.addEventListener('click', function (event) {
  if (event.target && event.target.classList.contains('add_inst_btn')) {
    numOfInstructions++;
    nextButton.disabled = false;
    nextButton.style.color = 'white';
    event.target.hidden = true;
    let row = event.target.parentElement;
    row.classList.remove('invalid');
    let instType = row.getElementsByClassName('inst_type')[0];
    let inst = row.getElementsByClassName('inst')[0];
    let deleteButton = row.getElementsByClassName('delete_inst_btn')[0];
    deleteButton.hidden = false;

    let fields = row.getElementsByClassName('inst_field');
    for (let index = 0; index < fields.length; index++) {
      if (instType.value === 'load') {
        inst.textContent =
          'LOAD R' +
          fields[0].value +
          ', ' +
          fields[3].value +
          '(R' +
          fields[1].value +
          ')';
      } else if (instType.value === 'store') {
        inst.textContent =
          'STORE R' +
          fields[0].value +
          ', ' +
          fields[3].value +
          '(R' +
          fields[1].value +
          ')';
      } else if (instType.value === 'bne') {
        inst.textContent =
          'BNE R' +
          fields[0].value +
          ', R' +
          fields[1].value +
          ', ' +
          fields[3].value;
      } else if (instType.value === 'call') {
        inst.textContent = 'CALL ' + fields[3].value;
      } else if (instType.value === 'return') {
        inst.textContent = 'RET';
      } else if (instType.value === 'add') {
        inst.textContent =
          'ADD R' +
          fields[0].value +
          ', R' +
          fields[1].value +
          ', R' +
          fields[2].value;
      } else if (instType.value === 'addi') {
        inst.textContent =
          'ADD R' +
          fields[0].value +
          ', R' +
          fields[1].value +
          ', ' +
          fields[4].value;
      } else if (instType.value === 'nand') {
        inst.textContent =
          'NAND R' +
          fields[0].value +
          ', R' +
          fields[1].value +
          ', R' +
          fields[2].value;
      } else if (instType.value === 'div') {
        inst.textContent =
          'DIV R' +
          fields[0].value +
          ', R' +
          fields[1].value +
          ', R' +
          fields[2].value;
      }
    }

    let newRow = row.cloneNode(true);
    newRow.classList.add('invalid');

    let newFields = newRow.getElementsByClassName('inst_field');
    for (let index = 0; index < newFields.length; index++) {
      newFields[index].value = '';
      newFields[index].disabled = true;
    }

    let newAddButton = newRow.getElementsByClassName('add_inst_btn')[0];
    newAddButton.hidden = false;
    newAddButton.disabled = true;
    newAddButton.style.color = '';

    let newInst = newRow.getElementsByClassName('inst')[0];
    newInst.textContent = '';
    newInst.hidden = true;

    let newDeleteButton = newRow.getElementsByClassName('delete_inst_btn')[0];
    newDeleteButton.hidden = true;

    instructionsDiv.appendChild(newRow);
  } else if (
    event.target &&
    event.target.classList.contains('delete_inst_btn')
  ) {
    numOfInstructions--;
    if (numOfInstructions === 0) {
      nextButton.disabled = true;
      nextButton.style.color = '';
    }
    let row = event.target.parentElement;
    instructionsDiv.removeChild(row);
  }
});
