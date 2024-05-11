import React, { useState } from 'react';
import { FloatButton, Button, Dropdown, Space, Menu, message } from 'antd';
import { CustomerServiceOutlined, CommentOutlined, QuestionCircleOutlined, EditOutlined } from '@ant-design/icons';
import { DownOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';
import './Formula.css';

// 显示菜单
const onClick = ({ key }) => {
  message.info(`Click on item ${key}`);
};


const items1 = [
  {key: '1', symbol: "+", label: "+"}, {key: '2', symbol: "-", label: "-"}, {key: '3', symbol: "\\times", label: "×"},
  {key: '4', symbol: "{\\div}", label: "÷"}, {key: '5', symbol: "\\pm", label: "±"}, {key: '6', symbol: "\\mp", label: "∓"},
  {key: '7', symbol: "\\cdot", label: "."}, {key: '8', symbol: "\\setminus", label: "\\"}, {key: '9', symbol: "\\ast", label: "*"},
  {key: '10', symbol: "\\cup", label: "∪"}, {key: '11', symbol: "\\cap", label: "∩"}, {key: '12', symbol: "\\vee", label: "∨"},
  {key: '13', symbol: "\\wedge", label: "∧"}, {key: '14', symbol: "<", label: "<"}, {key: '15', symbol: ">", label: ">"},
  {key: '16', symbol: "=", label: "="}, {key: '17', symbol: "\\le", label: "≤"}, {key: '18', symbol: "\\ge", label: "≥"},
  {key: '19', symbol: "\\equiv", label: "≡"}, {key: '20', symbol: "\\ll", label: "<<"}, {key: '21', symbol: "\\gg", label: ">>"},
  {key: '22', symbol: "\\subset", label: "⊂"}, {key: '23', symbol: "\\supset", label: "⊃"}, {key: '24', symbol: "\\subseteq", label: "⊆"},
  {key: '25', symbol: "\\supseteq", label: "⊇"}, {key: '26', symbol: "\\in", label: "∈"}, {key: '27', symbol: "\\notin", label: "∉"},
  {key: '28', symbol: "\\ne", label: "≠"}, {key: '29', symbol: "\\Leftrightarrow", label: "⇔"}, {key: '30', symbol: "\\to", label: "→"},
];
const items2 = [
  {key: '1', symbol: "\\alpha", label: "α"}, {key: '2', symbol: "\\beta", label: "β"}, {key: '3', symbol: "\\gamma", label: "γ"},
  {key: '4', symbol: "{\\delta}", label: "δ"}, {key: '5', symbol: "\\epsilon", label: "ε"}, {key: '6', symbol: "\\eta", label: "η"},
  {key: '7', symbol: "\\theta", label: "θ"}, {key: '8', symbol: "\\lambda", label: "λ"}, {key: '9', symbol: "\\mu", label: "μ"},
  {key: '10', symbol: "\\nu", label: "ν"}, {key: '11', symbol: "\\zeta", label: "ζ"}, {key: '12', symbol: "\\pi", label: "π"},
  {key: '13', symbol: "\\rho", label: "ρ"}, {key: '14', symbol: "\\sigma", label: "σ"}, {key: '15', symbol: "\\tau", label: "τ"},
  {key: '16', symbol: "\\varphi", label: "φ"}, {key: '17', symbol: "\\chi", label: "χ"}, {key: '18', symbol: "\\psi", label: "ψ"},
  {key: '19', symbol: "\\omega", label: "ω"}, {key: '20', symbol:"o", label:"o"}, {key: '21', symbol:"\\kappa ", label:"κ"}, 
];
const items3 = [
  {key: '1', symbol: "\\mathrm{d}t", label: "dt"}, {key: '2', symbol: "\\partial t", label: "∂t"}, {key: '3', symbol: "{}'", label: "f'"}, 
  {key: '4', symbol: "{}''", label: "f''"}, {key: '5', symbol: "{}^{(n)}", label: "f⁽ⁿ⁾"},{key: '6', symbol: "\\sqrt{}", label: "√"},
  {key: '7', symbol: "\\sqrt[]{} ", label: "ⁿ√"}, {key: '8', symbol: "^{ }", label: "ⁿ"},{key: '9', symbol: "_{}", label: "ₙ"}, 
  {key: '10', symbol: "_{}^{}", label: "ᵐₙ"}, {key: '11', symbol: "\\lim ", label: "lim"},{key: '12', symbol: "\\exp", label: "exp"}, 
  {key: '13', symbol: "\\log ", label: "log"}, {key: '14', symbol: "\\lg", label: "lg"}, {key: '15', symbol: "\\ln", label: "ln"},
  {key: '16', symbol: "\\sin", label: "sin"}, {key: '17', symbol: "\\cos", label: "cos"}, {key: '18', symbol: "\\tan", label: "tan"}, 
  {key: '19', symbol: "\\cot''", label: "cot"}, {key: '20', symbol: "\\sec", label: "sec"},{key: '21', symbol: "\\csc", label: "csc"},
  {key: '22', symbol: "\\int", label: "∫"}, {key: '23', symbol: "\\iint", label: "∬"},{key: '24', symbol: "\\iiint ", label: "∭"}, 
  {key: '25', symbol: "\\oint ", label: "∮"}, {key: '26', symbol: "\\sum", label: "Σ"}, {key: '27', symbol: "\\prod", label: "∏"}
];
const items4 = [
  {key: '1', symbol: "\\left (", label: "("}, {key: '2', symbol: "\\right )", label: ")"}, {key: '3', symbol: "\\left [", label: "["}, 
  {key: '4', symbol: "\\right ]", label: "]"}, {key: '5', symbol: "\\left \\langle", label: "<"}, {key: '6', symbol: "\\right \\rangle", label: ">"},
  {key: '7', symbol: "\\left \\{", label: "{"}, {key: '8', symbol: "\\right \\}", label: "{"}, {key: '9', symbol: "\\left \\lfloor", label: "⌊"},
  {key: '10', symbol: "\\right \\rfloor ", label: "⌋"},{key: '11', symbol: "\\left \\lceil", label: "⌈"}, {key: '12', symbol: "\\right \\rceil  ", label: "⌉"},
];





const Formula = ({ handleSymbolClick }) => {
  const [showButtons, setShowButtons] = useState(false);

  const handleButtonClick = () => {
    setShowButtons(true);
    setShowSymbols1(false);
    setShowSymbols2(false);
    setShowSymbols3(false);
    setShowSymbols4(false);
  };

  // 设置具体内容的可视标志
  const [showSymbols1, setShowSymbols1] = useState(false);
  const [showSymbols2, setShowSymbols2] = useState(false);
  const [showSymbols3, setShowSymbols3] = useState(false);
  const [showSymbols4, setShowSymbols4] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  const handleMenuClick1 = () => {
    setShowSymbols1(!showSymbols1);
    setShowSymbols2(false);
    setShowSymbols3(false);
    setShowSymbols4(false);
    setSelectedSymbol(null);
  };
  const handleMenuClick2 = () => {
    setShowSymbols2(!showSymbols2);
    setShowSymbols1(false);
    setShowSymbols3(false);
    setShowSymbols4(false);
    setSelectedSymbol(null);
  };
  const handleMenuClick3 = () => {
    setShowSymbols3(!showSymbols3);
    setShowSymbols1(false);
    setShowSymbols2(false);
    setShowSymbols4(false);
    setSelectedSymbol(null);
  };
  const handleMenuClick4 = () => {
    setShowSymbols4(!showSymbols4);
    setShowSymbols1(false);
    setShowSymbols2(false);
    setShowSymbols3(false);
    setSelectedSymbol(null);
  };
  

  const handleSymbolItemClick1 = (symbol) => {
    handleSymbolClick(symbol);
    setSelectedSymbol(symbol);
    setShowSymbols1(false);
    setShowSymbols2(false);
    setShowSymbols3(false);
    setShowSymbols4(false);
  };
  const handleSymbolItemClick2 = (symbol) => {
    handleSymbolClick(symbol);
    setSelectedSymbol(symbol);
    setShowSymbols1(false);
    setShowSymbols2(false);
    setShowSymbols3(false);
    setShowSymbols4(false);
  };
  const handleSymbolItemClick3 = (symbol) => {
    handleSymbolClick(symbol);
    setSelectedSymbol(symbol);
    setShowSymbols1(false);
    setShowSymbols2(false);
    setShowSymbols3(false);
    setShowSymbols4(false);
  };
  const handleSymbolItemClick4 = (symbol) => {
    handleSymbolClick(symbol);
    setSelectedSymbol(symbol);
    setShowSymbols1(false);
    setShowSymbols2(false);
    setShowSymbols3(false);
    setShowSymbols4(false);
  };
  
  const renderSymbols1 = () => (
      <Menu>
        {items1.map((item) => (
          <Menu.Item key={item.key} onClick={() => handleSymbolItemClick1(item.symbol)} className="symbol-item">
            {item.label}
          </Menu.Item>
        ))}
      </Menu>
  );
  const renderSymbols2 = () => (
      <Menu>
        {items2.map((item) => (
          <Menu.Item key={item.key} onClick={() => handleSymbolItemClick2(item.symbol)}>
            {item.label}
          </Menu.Item>
        ))}
      </Menu>
  );
  const renderSymbols3 = () => (
    <Menu>
      {items3.map((item) => (
        <Menu.Item key={item.key} onClick={() => handleSymbolItemClick3(item.symbol)}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  );
  const renderSymbols4 = () => (
    <Menu>
      {items4.map((item) => (
        <Menu.Item key={item.key} onClick={() => handleSymbolItemClick4(item.symbol)}>
          {item.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    // <Tooltip title='公式提示' arrow placement='left'>
    <FloatButton.Group
      trigger="click"
      type="primary"
      placement='left'
      // 问号标志
      icon={<EditOutlined />}
      onClick={handleButtonClick}
    >
      {showButtons && (
        <>
          {/* 公式集合1 */}
           <Dropdown
              overlay={renderSymbols1}
              trigger={['click']}
              visible={showSymbols1}
              onVisibleChange={handleMenuClick1}
              placement='left'
            >
              <Button>常用符号</Button>
            </Dropdown>
          {/* 公式集合2 */}
          <Dropdown
              overlay={renderSymbols2}
              trigger={['click']}
              visible={showSymbols2}
              onVisibleChange={handleMenuClick2}
              placement='left'
            >
              <Button>希腊字母</Button>
            </Dropdown>
          {/* 公式合集3 */}
          <Dropdown
            overlay={renderSymbols3}
            trigger={['click']}
            visible={showSymbols3}
            onVisibleChange={handleMenuClick3}
            placement='left'
          >
            <Button>微分积分</Button>
          </Dropdown>
          {/* 公式合集4 */}
          <Dropdown
            overlay={renderSymbols4}
            trigger={['click']}
            visible={showSymbols4}
            onVisibleChange={handleMenuClick4}
            placement='left'
          >
            <Button>括号取整</Button>
          </Dropdown>
        
        </>
      )}
    </FloatButton.Group>
    // </Tooltip>
  );
};

export default Formula;

