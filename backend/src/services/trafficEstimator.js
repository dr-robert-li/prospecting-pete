export class TrafficEstimator {
    getTrafficRange(rank) {
      const ranges = [
        { max: 1000, range: ["20M", "∞"] },
        { max: 2500, range: ["10M", "20M"] },
        { max: 5000, range: ["5M", "10M"] },
        { max: 10000, range: ["2M", "5M"] },
        { max: 20000, range: ["1M", "2M"] },
        { max: 50000, range: ["500K", "1M"] },
        { max: 100000, range: ["200K", "500K"] },
        { max: 250000, range: ["100K", "200K"] },
        { max: 500000, range: ["50K", "100K"] },
        { max: 1000000, range: ["20K", "50K"] },
        { max: 1500000, range: ["10K", "20K"] },
        { max: 2000000, range: ["5K", "10K"] },
        { max: 5000000, range: ["2K", "5K"] },
        { max: 10000000, range: ["1K", "2K"] }
      ];
  
      const range = ranges.find(r => rank <= r.max) || { range: ["0", "1K"] };
      return {
        lowEstimate: range.range[0],
        highEstimate: range.range[1]
      };
    }
  
    estimateFromAlexaRank(alexaRank) {
      if (alexaRank <= 0) return 0;
      const traffic = (7.881e10 / Math.pow(alexaRank, 1.257)) * 10;
      return Math.floor(traffic);
    }
  }
  
  export default new TrafficEstimator();
  