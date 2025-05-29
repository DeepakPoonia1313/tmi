// components/MultiStateSelector.jsx
import { BasePropertyProps } from 'adminjs'
import React, { useEffect, useState } from 'react'
import { Select } from '@adminjs/design-system'

const MultiStateSelector = (props) => {
  const { onChange, record, property } = props
  const [options, setOptions] = useState([])

  useEffect(() => {
    fetch('/admin/api/resources/state/actions/list')
      .then(res => res.json())
      .then(data => {
        const states = data.records.map(rec => ({
          value: rec.params.id,
          label: rec.params.name, // adjust if your state table uses different field
        }))
        setOptions(states)
      })
  }, [])

  const handleChange = selected => {
    const values = selected.map(option => option.value)
    onChange(property.name, values)
  }

  const selected = (record.params[property.name] || []).map(id => ({
    value: id,
    label: options.find(o => o.value === id)?.label || id,
  }))

  return (
    <Select
      isMulti
      options={options}
      value={selected}
      onChange={handleChange}
    />
  )
}

export default MultiStateSelector
