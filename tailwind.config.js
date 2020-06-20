module.exports = {
  theme: {
    extend: {
      height:{
        'screen-1/4': '25vh',
        'screen-1/2': '50vh',
        'screen-3/4': '75vh',
        'video'     : '315px'
      }
    },
    borderRadius : {
      'none': '0',
      'sm'  : '.5rem',
      'md'  : '1rem',
      'lg'  : '2rem',
      'full': '9999px'
    },
  variants: {
    transform:['hover'],
    transitionTimingFunction:['hover']
  },
  plugins: []
}
}
