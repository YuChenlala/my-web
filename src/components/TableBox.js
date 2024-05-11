import React, { useState, useRef } from 'react';

// function addRowToTable({tableHTML}) {
//   const parser = new DOMParser();
//   const doc = parser.parseFromString(tableHTML, 'text/html');
//   const rows = doc.querySelectorAll('table tr');
//   const columns = rows[0] ? rows[0].children : [];
//   const rowlen = rows.length;
//   const collen = columns.length;
//   const table = doc.querySelector('table');
//   const newRow = document.createElement('tr');
//   for (let i = 0; i < rowlen; i++) {
//     const newCell = document.createElement('td');
//     newCell.textContent = `空白`; // 示例新单元格数据
//     newRow.appendChild(newCell);
//   }
//   table.querySelector('tbody').appendChild(newRow);
//   return doc.documentElement.outerHTML;
// }

// export default addRowToTable;

// tableBox.js

function addRow(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // 找到表格元素
  const table = doc.querySelector('table');

  // 获取表头列数
  const headerCellsCount = table.querySelector('thead tr').childElementCount;

  // 创建新行，并根据表头列数添加相应数量的单元格
  const newRow = document.createElement('tr');
  for (let i = 0; i < headerCellsCount; i++) {
    const newCell = document.createElement('td');
    newCell.textContent = `空白`; // 示例新单元格数据
    newRow.appendChild(newCell);
  }

  // 将新行添加到表格的 tbody 中
  table.querySelector('tbody').appendChild(newRow);

  // 返回更新后的 HTML 字符串
  return doc.documentElement.outerHTML;
}

function addColumn(htmlString) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');

  // 找到表格元素
  const table = doc.querySelector('table');

  // 获取所有行
  const rows = table.querySelectorAll('tr');

  // 在每一行的末尾添加新列
  rows.forEach(row => {
    const newCell = document.createElement('td');
    newCell.textContent = `空白`; // 示例新列数据
    row.appendChild(newCell);
  });

  // 返回更新后的 HTML 字符串
  return doc.documentElement.outerHTML;
}

export { addRow, addColumn };
