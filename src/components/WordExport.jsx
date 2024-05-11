import React from 'react';
import mammoth from 'mammoth';
import {
    Button,
} from '@douyinfe/semi-ui';
class WordExport extends React.Component {
  exportToWord = () => {
    const { content } = this.props;
    mammoth.convertToHtml(content)
      .then((result) => {
        const blob = new Blob([result.value], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'exported-document.docx';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error('µ¼³öÊ§°Ü', error);
      });
  }
  render() {
    return (
      <div>
        <Button type="secondary"onClick={this.exportToWord}>Convert to Word</Button>
      </div>
    );
  }
}

export default WordExport;
