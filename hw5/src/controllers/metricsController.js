const client = require('prom-client');
const gaussian = require('gaussian');


function activeUsersPerCategoryMetric(registry) {
  const gauge = new client.Gauge({
    name: 'active_users',
    help: 'Amount of active users right now per category',
    registers: [registry],
    labelNames: [
      'category',
    ],
  });

  // const myGauge = new client.Gauge({
  //   name: 'my_gauge',
  //   help: 'Amount of something',
  //   registers: [registry],
  //   labelNames: [
  //     'category',
  //   ],
  // });
  
  // To make data looks more
  const categoriesWithDistribution = [
    ['oil', 100, 30],
    ['wine', 200, 30],
    ['bread', 300, 30],
    ['butter', 400, 30],
  ];
  
  async function collectActiveUsers() {
    categoriesWithDistribution.map(async ([category, mean, variance]) => {
      gauge.set(
        { category },
        Math.floor(gaussian(mean, variance).ppf(Math.random())),
      );
    });
  }

  // async function collectMyUsers() {
  //   myGauge.set(
  //     { category : 'my_category' }, 
  //     Math.random()
  //   );
  // }
  
  setInterval(collectActiveUsers, 5000);
  // setInterval(collectMyUsers, 5000);
}


module.exports = (registry) => {
  activeUsersPerCategoryMetric(registry);
};
