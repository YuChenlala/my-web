import React from 'react';

class TestComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      htmlString: '<table>\n<thead>\n<tr>\n<td>\n      因子项\n     </td>\n<td>\n      实验组\n     </td>\n<td>\n      正常对照组\n     </td>\n<td>\n      t\n     </td>\n<td>\n      P\n     </td>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td>\n      Hs\n     </td>\n<td>\n      56.91 ±9.70\n     </td>\n<td>\n      42.78 ±6.40\n     </td>\n<td>\n      8.101\n     </td>\n<td>\n      0.00\n     </td>\n</tr>\n<tr>\n<td>\n      D\n     </td>\n<td>\n      61.91 ±12.03\n     </td>\n<td>\n      39.20 ±9.36\n     </td>\n<td>\n      9. 746\n     </td>\n<td>\n      0.00\n     </td>\n</tr>\n<tr>\n<td>\n      Hy\n     </td>\n<td>\n      63.04 ±10.84\n     </td>\n<td>\n      44. 63 ±8.48\n     </td>\n<td>\n      8. 869\n     </td>\n<td>\n      0.00\n     </td>\n</tr>\n<tr>\n<td>\n      Pd\n     </td>\n<td>\n      60.20 ±12.31\n     </td>\n<td>\n      47.63±9.35\n     </td>\n<td>\n      5.309\n     </td>\n<td>\n      0.00\n     </td>\n</tr>\n<tr>\n<td>\n      Mf\n     </td>\n<td>\n      52.41 ±11.60\n     </td>\n<td>\n      44.41±11.26\n     </td>\n<td>\n      3. 254\n     </td>\n<td>\n      0. 00\n     </td>\n</tr>\n<tr>\n<td>\n      Pa\n     </td>\n<td>\n      57.72 ±11.57\n     </td>\n<td>\n      42.95 ±8.45\n     </td>\n<td>\n      6. 727\n     </td>\n<td>\n      0. 00\n     </td>\n</tr>\n<tr>\n<td>\n      Pt\n     </td>\n<td>\n      59. 43 ±11.55\n     </td>\n<td>\n      40. 90 ±9. 29\n     </td>\n<td>\n      8. 180\n     </td>\n<td>\n      0. 00\n     </td>\n</tr>\n<tr>\n<td>\n      Sc\n     </td>\n<td>\n      55.48 ±11.41\n     </td>\n<td>\n      42.32 ±10.01\n     </td>\n<td>\n      5.689\n     </td>\n<td>\n      0.00\n     </td>\n</tr>\n<tr>\n<td>\n      Ma\n     </td>\n<td>\n      51.39 ±10.17\n     </td>\n<td>\n      49.63±8.81\n     </td>\n<td>\n      0.856\n     </td>\n<td>\n      0.42\n     </td>\n</tr>\n<tr>\n<td>\n      Si\n     </td>\n<td>\n      49.67±13.05\n     </td>\n<td>\n      40.22 业 ±12.16\n     </td>\n<td>\n      3.483\n     </td>\n<td>\n      0.00\n     </td>\n</tr>\n</tbody>\n</table>'
    };
  }

  addRowToTable = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.state.htmlString, 'text/html');

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

    // 更新状态以重新渲染页面
    this.setState({ htmlString: doc.documentElement.outerHTML });
  }

  addColumnToTable = () => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.state.htmlString, 'text/html');

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

    // 更新状态以重新渲染页面
    this.setState({ htmlString: doc.documentElement.outerHTML });
  }

  render() {
    return (
      <div>
        <h1>Test Program</h1>
        <h2>Original Table:</h2>
        <div dangerouslySetInnerHTML={{ __html: this.state.htmlString }}></div>

        <button onClick={this.addRowToTable}>Add Row</button>
        <button onClick={this.addColumnToTable}>Add Column</button>
      </div>
    );
  }
}

export default TestComponent;