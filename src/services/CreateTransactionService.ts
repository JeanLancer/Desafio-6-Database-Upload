import { getRepository, getCustomRepository } from 'typeorm';

// import AppError from '../errors/AppError';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

import TransactionsRepository from '../repositories/TransactionsRepository';

interface Request {
  title: string;
  value: number;
  type: 'income' | 'outcome';
  category: string;
}

class CreateTransactionService {
  public async execute({
    title,
    value,
    type,
    category,
  }: Request): Promise<Transaction> {
    const transactionRepository = getCustomRepository(TransactionsRepository);
    const categoryRepository = getRepository(Category);

    if (type === 'outcome') {
      const balance = await transactionRepository.getBalance();

      console.log('balance');
      console.log(balance.total);
      console.log('value');
      console.log(value);

      if (balance.total < value) {
        throw Error('insufficient funds');
      }
    }

    const findCategoryByName = await categoryRepository.findOne({
      where: { title: category },
    });

    let category_id = null;

    if (typeof findCategoryByName !== 'undefined') {
      category_id = findCategoryByName.id;
    } else {
      const newCategory = categoryRepository.create({
        title: category,
      });

      await categoryRepository.save(newCategory);

      category_id = newCategory.id;
    }

    const transactionData = transactionRepository.create({
      title,
      value,
      type,
      category_id,
    });

    const transaction = await transactionRepository.save(transactionData);

    return transaction;
  }
}

export default CreateTransactionService;
