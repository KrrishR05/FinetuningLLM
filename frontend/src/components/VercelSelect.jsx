import { useEffect, useId, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown } from 'lucide-react'

export default function VercelSelect({
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  className = '',
  icon: Icon,
  disabled = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const listboxId = useId()
  const selectedOption = options.find(option => option.value === value) || options[0]

  useEffect(() => {
    const handleClickOutside = event => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsOpen(false)
    }
    const handleEscape = event => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const toggleDropdown = () => {
    if (!disabled) setIsOpen(open => !open)
  }

  return (
    <div className={`select-field ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={toggleDropdown}
        className="select-field__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        disabled={disabled}
      >
        <span className="select-field__value">
          {Icon && <Icon size={15} className="select-field__icon" />}
          {selectedOption?.icon && <selectedOption.icon size={15} className="select-field__icon" />}
          <span className="truncate">{selectedOption?.label || selectedOption?.value || placeholder}</span>
        </span>

        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.16 }}
          className="select-field__chevron"
        >
          <ChevronDown size={15} />
        </motion.span>
      </button>

      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            id={listboxId}
            role="listbox"
            initial={{ opacity: 0, y: -5, scale: 0.985 }}
            animate={{ opacity: 1, y: 5, scale: 1 }}
            exit={{ opacity: 0, y: -5, scale: 0.985 }}
            transition={{ duration: 0.14, ease: 'easeOut' }}
            className="select-field__menu"
          >
            {options.map(option => {
              const isSelected = option.value === value
              const OptionIcon = option.icon

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`select-field__option ${isSelected ? 'is-selected' : ''}`}
                >
                  <span className="select-field__option-copy">
                    {OptionIcon && <OptionIcon size={14} />}
                    <span className="truncate">
                      <b>{option.label || option.value}</b>
                      {option.description && <small>{option.description}</small>}
                    </span>
                  </span>
                  {isSelected && <Check size={15} />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
