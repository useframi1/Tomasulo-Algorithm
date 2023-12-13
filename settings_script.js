'use strict';

let startButton = document.getElementsByClassName('start_btn')[0];
let valuesDiv = document.getElementsByClassName('values')[0];
let rows = valuesDiv.getElementsByClassName('row');
let startingAddrInput = document.getElementsByClassName('starting_addr')[0];
let startingAddr = -1;

window.addEventListener('pageshow', function () {
  startingAddrInput.value = '';
  var fields = document.getElementsByClassName('value_field');
  for (let i = 0; i < fields.length; i++) {
    fields[i].value = '';
  }
});

class DataValue {
  constructor(address, value) {
    this.address = address;
    this.value = value;
  }
}

startButton.addEventListener('click', function (event) {
  if (event.target) {
    let dataValues = [];

    for (let index = 0; index < rows.length; index++) {
      if (!rows[index].classList.contains('invalid')) {
        let address = parseInt(
          rows[index].getElementsByClassName('value_field')[0].value
        );
        let value = parseInt(
          rows[index].getElementsByClassName('value_field')[1].value
        );
        let dataValue = new DataValue(address, value);
        dataValues.push(dataValue);
      }
    }
    localStorage.setItem('dataValues', JSON.stringify(dataValues));
    localStorage.setItem('startingAddress', startingAddr);
    window.location.href = 'algorithm.html';
  }
});

startingAddrInput.addEventListener('input', function (event) {
  if (event.target) {
    if (event.target.value == '') {
      event.target.style.background = '';
      startButton.disabled = true;
      startButton.style.color = '';
    } else if (
      event.target.value < 0 ||
      event.target.value > 128000 ||
      isNaN(event.target.value)
    ) {
      event.target.style.background = 'red';
      startButton.disabled = true;
      startButton.style.color = '';
    } else {
      event.target.style.background = '';
      startButton.disabled = false;
      startButton.style.color = 'white';
      startingAddr = event.target.value;
    }
  }
});

valuesDiv.addEventListener('input', function (event) {
  if (event.target && event.target.classList.contains('value_field')) {
    let row = event.target.parentElement.parentElement;
    let addButton = row.getElementsByClassName('add_value_btn')[0];
    if (event.target.placeholder === 'Address') {
      if (
        event.target.value < 0 ||
        event.target.value > 128000 ||
        isNaN(event.target.value)
      ) {
        event.target.style.background = 'red';
      } else {
        event.target.style.background = '';
      }
    } else if (event.target.placeholder === 'Value') {
      if (
        event.target.value < -32768 ||
        event.target.value > 32767 ||
        isNaN(event.target.value)
      ) {
        event.target.style.background = 'red';
      } else {
        event.target.style.background = '';
      }
    }
    let fields = row.getElementsByClassName('value_field');
    let disable = false;
    for (let index = 0; index < fields.length; index++) {
      if (
        fields[index].style.background === 'red' ||
        fields[index].value === ''
      )
        disable = true;
    }
    addButton.disabled = disable;
    addButton.style.color = disable ? '' : 'white';
  }
});

valuesDiv.addEventListener('click', function (event) {
  if (event.target && event.target.classList.contains('add_value_btn')) {
    event.target.hidden = true;
    let row = event.target.parentElement;
    row.classList.remove('invalid');
    let address = row.getElementsByClassName('value_field')[0].value;
    let value = row.getElementsByClassName('value_field')[1].value;
    let valueText = row.getElementsByClassName('value')[0];
    let deleteButton = row.getElementsByClassName('delete_value_btn')[0];
    deleteButton.hidden = false;

    valueText.textContent = 'MEM[' + address + '] = ' + value;
    valueText.hidden = false;

    let newRow = row.cloneNode(true);
    newRow.classList.add('invalid');
    let newAddress = newRow.getElementsByClassName('value_field')[0];
    let newValue = newRow.getElementsByClassName('value_field')[1];
    let newValueText = newRow.getElementsByClassName('value')[0];
    let newDeleteButton = newRow.getElementsByClassName('delete_value_btn')[0];
    let newAddButton = newRow.getElementsByClassName('add_value_btn')[0];

    newAddress.value = '';
    newValue.value = '';
    newValueText.textContent = '';
    newValueText.hidden = true;
    newDeleteButton.hidden = true;

    newAddButton.hidden = false;
    newAddButton.disabled = true;
    newAddButton.style.color = '';

    valuesDiv.appendChild(newRow);
  } else if (
    event.target &&
    event.target.classList.contains('delete_value_btn')
  ) {
    let row = event.target.parentElement;
    valuesDiv.removeChild(row);
  }
});
