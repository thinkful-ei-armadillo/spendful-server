const { DateTime } = require('luxon');
const { RRule }    = require('rrule');

const createRRule = function (startDate, frequency, endDate = null) {

  const options = {};

  options.dtstart = startDate;

  if (frequency === 'biweekly') {
    options.freq     = RRule.WEEKLY;
    options.interval = 2;
  }

  if (frequency === 'weekly') {
    options.freq     = RRule.WEEKLY;
    options.interval = 1;
  }

  if (frequency === 'monthly') {
    options.freq     = RRule.MONTHLY;
    options.interval = 1;
  }

  if (frequency === 'yearly') {
    options.freq     = RRule.YEARLY;
    options.interval = 1;
  }

  if (endDate) {
    options.until = endDate;
  }

  return new RRule(options);
};

const sortCombinedList = function (a, b) {

  // -1, A comes before B
  //  1, B comes before A
  //  0, A and B are equal

  const dateA = new Date(a.occurrence_date);
  const dateB = new Date(b.occurrence_date);

  // Sort by occurrence_date
  if (dateA > dateB) { return -1; }
  if (dateA < dateB) { return  1; }

  // Sort by description
  if (a.description > b.description) { return -1; }
  if (a.description < b.description) { return  1; }

  return 0;
};

const reportService = {
  getIncomesByYear(db, year, owner_id){

    return db('incomes')
      .select('*')
      .andWhere({owner_id})
      .andWhere(db.raw('cast(EXTRACT(YEAR from start_date) as integer)'), year)
      .whereNull('recurring_rule')
      .orderBy([
        { column: 'start_date',  order: 'desc' },
        { column: 'description', order: 'asc' }
      ])
      .then(noOccurrenceDates => {

        // Add occurrence_date to non-recurring events
        return noOccurrenceDates.map(row => {
          row.occurrence_date = row.start_date;
          return row;
        });
      })
      .then(nonRecurringEvents => {


        return db('incomes')
          .select('*')
          .where({owner_id})
          .whereNotNull('recurring_rule')
          .orderBy([
            { column: 'start_date',  order: 'desc' },
            { column: 'description', order: 'asc' }
          ])
          .then(recurringEvents => {

            const list = [];

            recurringEvents.forEach(r => {

              if (r.recurring_rule && r.start_date) {

                const start = new Date(r.start_date);
                const end = (r.end_date) ? new Date(r.end_date) : null;

                const rule = createRRule(start, r.recurring_rule, end);

                const firstDayOfYear = DateTime.fromObject({ year: year, month: 1, day: 1, zone: 'UTC' });
                const lastDayOfYear  = firstDayOfYear.plus({ years: 1 }).minus({ days: 1 });

                const occurences = rule.between(
                  firstDayOfYear.toJSDate(),
                  lastDayOfYear.toJSDate(),
                  true
                );

                // add each occurrence of recurring event to results
                occurences.forEach(o => {
                  const copy = { ...r };
                  copy.occurrence_date = o.toISOString();
                  list.push(copy);
                });

              } else {

                // add non-recurring event to results
                list.push(r);
              }
            });

            return  nonRecurringEvents.concat(list);
          });
      })
      .then(combinedLists => {

        return combinedLists.sort(sortCombinedList);
      });
  },

  getIncomesByYearAndMonth(db, year, month, owner_id){

    return db('incomes')
      .select('*')
      .andWhere({owner_id})
      .andWhere(db.raw('cast(EXTRACT(YEAR from start_date) as integer)'), year)
      .andWhere(db.raw('cast(EXTRACT(MONTH from start_date) as integer)'), month)
      .whereNull('recurring_rule')
      .orderBy([
        { column: 'start_date',  order: 'desc' },
        { column: 'description', order: 'asc' }
      ])
      .then(noOccurrenceDates => {

        // Add occurrence_date to non-recurring events
        return noOccurrenceDates.map(row => {
          row.occurrence_date = row.start_date;
          return row;
        });
      })
      .then(nonRecurringEvents => {


        return db('incomes')
          .select('*')
          .where({owner_id})
          .whereNotNull('recurring_rule')
          .orderBy([
            { column: 'start_date',  order: 'desc' },
            { column: 'description', order: 'asc' }
          ])
          .then(recurringEvents => {

            const list = [];

            recurringEvents.forEach(r => {

              if (r.recurring_rule && r.start_date) {

                const start = new Date(r.start_date);
                const end = (r.end_date) ? new Date(r.end_date) : null;

                const rule = createRRule(start, r.recurring_rule, end);

                const firstDayOfMonth = DateTime.fromObject({ year: year, month: month, day: 1, zone: 'UTC' });
                const lastDayOfMonth  = firstDayOfMonth.plus({ months: 1 }).minus({ days: 1 });

                const occurences = rule.between(
                  firstDayOfMonth.toJSDate(),
                  lastDayOfMonth.toJSDate(),
                  true
                );

                // add each occurrence of recurring event to results
                occurences.forEach(o => {
                  const copy = { ...r };
                  copy.occurrence_date = o.toISOString();
                  list.push(copy);
                });

              } else {

                // add non-recurring event to results
                list.push(r);
              }
            });

            return  nonRecurringEvents.concat(list);
          });
      })
      .then(combinedLists => {

        return combinedLists.sort(sortCombinedList);
      });
  },

  getExpensesByYear(db, year, owner_id){

    return db('expenses')
      .select('*')
      .andWhere({owner_id})
      .andWhere(db.raw('cast(EXTRACT(YEAR from start_date) as integer)'), year)
      .whereNull('recurring_rule')
      .orderBy([
        { column: 'start_date',  order: 'desc' },
        { column: 'description', order: 'asc' }
      ])
      .then(noOccurrenceDates => {

        // Add occurrence_date to non-recurring events
        return noOccurrenceDates.map(row => {
          row.occurrence_date = row.start_date;
          return row;
        });
      })
      .then(nonRecurringEvents => {

        return db('expenses')
          .select('*')
          .where({owner_id})
          .whereNotNull('recurring_rule')
          .orderBy([
            { column: 'start_date',  order: 'desc' },
            { column: 'description', order: 'asc' }
          ])
          .then(recurringEvents => {

            const list = [];

            recurringEvents.forEach(r => {

              if (r.recurring_rule && r.start_date) {

                const start = new Date(r.start_date);
                const end = (r.end_date) ? new Date(r.end_date) : null;

                const rule = createRRule(start, r.recurring_rule, end);

                const firstDayOfYear = DateTime.fromObject({ year: year, month: 1, day: 1, zone: 'UTC' });
                const lastDayOfYear  = firstDayOfYear.plus({ years: 1 }).minus({ days: 1 });

                const occurences = rule.between(
                  firstDayOfYear.toJSDate(),
                  lastDayOfYear.toJSDate(),
                  true
                );

                // add each occurrence of recurring event to results
                occurences.forEach(o => {
                  const copy = { ...r };
                  copy.occurrence_date = o.toISOString();
                  list.push(copy);
                });

              } else {

                // add non-recurring event to results
                list.push(r);
              }
            });

            return  nonRecurringEvents.concat(list);
          });
      })
      .then(combinedLists => {

        return combinedLists.sort(sortCombinedList);
      });
  },

  getExpensesByYearAndMonth(db, year, month, owner_id){

    return db('expenses')
      .select('*')
      .andWhere({owner_id})
      .andWhere(db.raw('cast(EXTRACT(YEAR from start_date) as integer)'), year)
      .andWhere(db.raw('cast(EXTRACT(MONTH from start_date) as integer)'), month)
      .whereNull('recurring_rule')
      .orderBy([
        { column: 'start_date',  order: 'desc' },
        { column: 'description', order: 'asc' }
      ])
      .then(noOccurrenceDates => {

        // Add occurrence_date to non-recurring events
        return noOccurrenceDates.map(row => {
          row.occurrence_date = row.start_date;
          return row;
        });
      })
      .then(nonRecurringEvents => {


        return db('expenses')
          .select('*')
          .where({owner_id})
          .whereNotNull('recurring_rule')
          .orderBy([
            { column: 'start_date',  order: 'desc' },
            { column: 'description', order: 'asc' }
          ])
          .then(recurringEvents => {

            const list = [];

            recurringEvents.forEach(r => {

              if (r.recurring_rule && r.start_date) {

                const start = new Date(r.start_date);
                const end = (r.end_date) ? new Date(r.end_date) : null;

                const rule = createRRule(start, r.recurring_rule, end);

                const firstDayOfMonth = DateTime.fromObject({ year: year, month: month, day: 1, zone: 'UTC' });
                const lastDayOfMonth  = firstDayOfMonth.plus({ months: 1 }).minus({ days: 1 });

                const occurences = rule.between(
                  firstDayOfMonth.toJSDate(),
                  lastDayOfMonth.toJSDate(),
                  true
                );

                // add each occurrence of recurring event to results
                occurences.forEach(o => {
                  const copy = { ...r };
                  copy.occurrence_date = o.toISOString();
                  list.push(copy);
                });

              } else {

                // add non-recurring event to results
                list.push(r);
              }
            });

            return  nonRecurringEvents.concat(list);
          });
      })
      .then(combinedLists => {

        return combinedLists.sort(sortCombinedList);
      });
  },
}

module.exports = reportService;
