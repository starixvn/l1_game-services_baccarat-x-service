import { Helpers } from "sc-card-game-base";

export default class ShoeConsumer {
    constructor(gameData, resultsRepository, roundsRepository, cutCardPFRepository) {
        this.gameData = gameData;
        this.resultsRepository = resultsRepository;
        this.roundsRepository = roundsRepository;
        this.cutCardPFRepository = cutCardPFRepository;
    }

    async getShoeVerification(roundId) {
        const round = await this.roundsRepository.findOne({ roundId }).lean().exec();
        const roundResult = await this.resultsRepository
            .findOne({ firstRoundId: { $lte: roundId }, lastRoundId: { $gte: roundId }, isAvailable: false }, { _id: false })
            .lean()
            .exec();
        const cutCardPF = await this.cutCardPFRepository
            .findOne({ roundId: roundResult?.firstRoundId }, { _id: false, time: false })
            .lean()
            .exec();

        if (round && roundResult) {
            const { burnedCards, cutCardIndex } = roundResult;
            const { cards, rawValue, hashValue } = this.decryptShoe(roundResult.shoe);
            const { usedCardIndexes } = round;

            return { shoeVerification: { cards, rawValue, hashValue, usedCardIndexes, burnedCards, cutCardIndex, cutCardPF } };
        }

        return { shoeVerification: {} };
    }

    decryptShoe({ encryptedShoe, encryptedShoeHash }) {
        const shoe = Helpers.CryptoHelper.decrypt(encryptedShoe);
        const hashValue = Helpers.CryptoHelper.decrypt(encryptedShoeHash);
        const cardString = shoe.split("_")[0];
        const cards = cardString.split(",");

        return { cards, rawValue: cardString, hashValue };
    }

    generateShoe(cardsFromAdmin, randomMode) {
        const { CardChain, CryptoHelper } = Helpers;
        const cards = CardChain.updateCards(CardChain.generateCards(8, randomMode), cardsFromAdmin);

        const shoeString = cards.map((card) => `${card.rank}${card.suit}`).toString();

        const rawValue = `${shoeString}_${CryptoHelper.randomString()}`;
        const hashValue = CryptoHelper.createHashSHA256(rawValue);
        const encryptedShoe = CryptoHelper.encrypt(rawValue);
        const encryptedShoeHash = CryptoHelper.encrypt(hashValue);

        return {
            cards,
            rawValue,
            hashValue,
            encryptedShoe,
            encryptedShoeHash,
        };
    }
}
