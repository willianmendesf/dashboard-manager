class DateUtils {
  constructor(date = new Date()) {
    this.date = date;
  }

  format(formatStr = 'dd/MM/yyyy') {
    const pad = (num, size = 2) => String(num).padStart(size, '0');

    const replacements = {
      dd: pad(this.date.getDate()),
      MM: pad(this.date.getMonth() + 1),
      yyyy: this.date.getFullYear(),
      HH: pad(this.date.getHours()),
      mm: pad(this.date.getMinutes()),
      ss: pad(this.date.getSeconds())
    };

    return formatStr.replace(/dd|MM|yyyy|HH|mm|ss/g, match => replacements[match]);
  }

  // You can also set a new date
  setDate(newDate) {
    this.date = new Date(newDate);
  }

  // Returns raw Date object
  getDate() {
    return this.date;
  }
}

module.exports = DateUtils