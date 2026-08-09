import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'

export default function VercelSelect({ options, value, onChange, placeholder = 'Select option...', className = '', icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  const selectedOption = options.find(opt => opt.value === value) || options[0]

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative inline-block w-full ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-[#0a0a0a] hover:bg-[#111111] border border-[#222222] hover:border-[#444444] rounded-md px-3 py-2 text-xs font-mono font-medium text-white flex items-center justify-between transition-all duration-150 outline-none focus:border-white"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {Icon && <Icon size={14} className="text-[#888888] shrink-0" />}
          {selectedOption?.icon && <selectedOption.icon size={14} className="text-blue-400 shrink-0" />}
          <span className="truncate">{selectedOption?.label || selectedOption?.value || placeholder}</span>
        </div>

        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.15 }}
          className="shrink-0 text-[#888888]"
        >
          <ChevronDown size={14} />
        </motion.div>
      </button>

      {/* Dropdown Menu Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className="absolute left-0 right-0 z-50 mt-1 bg-[#0a0a0a] border border-[#222222] rounded-md shadow-2xl overflow-hidden p-1 space-y-0.5 max-h-60 overflow-y-auto"
          >
            {options.map((option) => {
              const isSelected = option.value === value
              const OptionIcon = option.icon

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onChange(option.value)
                    setIsOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-xs font-mono flex items-center justify-between transition-colors ${
                    isSelected
                      ? 'bg-[#1a1a1a] text-white font-semibold'
                      : 'text-[#888888] hover:bg-[#141414] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    {OptionIcon && <OptionIcon size={13} className={isSelected ? 'text-white' : 'text-[#666666]'} />}
                    <div className="truncate">
                      <div className="truncate">{option.label || option.value}</div>
                      {option.description && (
                        <div className="text-[0.65rem] text-[#666666] font-normal truncate mt-0.5">{option.description}</div>
                      )}
                    </div>
                  </div>

                  {isSelected && <Check size={14} className="text-white shrink-0" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
