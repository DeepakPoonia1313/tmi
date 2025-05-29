// admin/components/RichTextEditorShow.jsx

import React from 'react'
import sanitize from 'sanitize-html'

const RichTextEditorShow = (props) => {
  const { record, property } = props
  const value = record.params[property.name]
  return (
    <div>
      <label>{property.label}</label>
      <div
        style={{ padding: '10px', border: '1px solid #ccc', maxHeight: 300, overflow: 'auto' }}
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}

export default RichTextEditorShow
