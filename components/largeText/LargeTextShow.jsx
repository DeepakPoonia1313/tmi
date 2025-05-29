import React from 'react'

const LargeTextShow = (props) => {
  const { record, property } = props
  const rawValue = record.params[property.name] || ''

  return (
    <div>
      <label htmlFor={`${property.label}`}>{property.label}</label>
      <div style={{ maxHeight: '300px', overflowY: 'auto', margin: '10px 0px 40px 0px' }}>
        {rawValue}
      </div>
    </div>
  )
}

export default LargeTextShow
