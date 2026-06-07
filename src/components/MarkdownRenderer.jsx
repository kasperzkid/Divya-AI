import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function Table({ children }) {
  return (
    <div className="markdown-table-wrapper">
      <table className="markdown-table">{children}</table>
    </div>
  )
}

function ThematicBreak() {
  return <hr className="markdown-hr" />
}

function MarkdownRenderer({ content }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        table: Table,
        thematicBreak: ThematicBreak
      }}
    >
      {content}
    </ReactMarkdown>
  )
}

export default MarkdownRenderer
