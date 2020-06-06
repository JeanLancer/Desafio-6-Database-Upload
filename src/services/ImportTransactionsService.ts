import fs from 'fs';
import csvParse from 'csv-parse';

import { getRepository, In } from 'typeorm';

import Transaction from '../models/Transaction';
import Category from '../models/Category';

interface CVSTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

class ImportTransactionsService {
  async execute(filePath: string): Promise<Transaction[]> {
    /* Get Repository */
    const categoryRepository = getRepository(Category);
    const transactionRepository = getRepository(Transaction);

    /* Initialize CSV PARSER */

    /* First Read Stream of filepath */
    const readStream = fs.createReadStream(filePath);

    /* Parser initialize from line 2 */

    const parser = csvParse({
      from_line: 2,
    });

    const parseCSV = readStream.pipe(parser);

    /* Initialize  transactions  conversor */

    const transactions: CVSTransaction[] = [];
    const categories: string[] = [];

    /* Initialize parse */

    parseCSV.on('data', async line => {
      /* Initialize map function finding this */
      const [title, type, value, category] = line.map((cell: string) =>
        cell.trim(),
      );

      /* If not have the field above return  */
      if (!title || !type || !value) return;

      /* Push for the Array  */

      categories.push(category);
      transactions.push({ title, type, value, category });
    });

    /* This is so Importante its one promise when return the final action of parser */

    await new Promise(resolve => parseCSV.on('end', resolve));

    /* Finding in the database if categories are exists and return this on a object */

    const existentCategories = await categoryRepository.find({
      where: {
        title: In(categories),
      },
    });

    /* This is a Map to take only category title */
    const exsitentCategoriesTitle = existentCategories.map(
      (category: Category) => category.title,
    );

    /* Filter if categoriesTitle are included in category  and the next filter
      inform if have more than one category with da same name returns only one
 */
    const addCategoryTitle = categories
      .filter(category => !exsitentCategoriesTitle.includes(category))
      .filter((value, index, self) => self.indexOf(value) === index);

    /* Add  new categories in  one massive event */
    const newCategories = categoryRepository.create(
      addCategoryTitle.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategories);

    /* this Array receive existent categories and created categories in database */

    const finalCategories = [...newCategories, ...existentCategories];

    const createdTransactions = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: finalCategories.find(
          category => category.title === transaction.category,
        ),
      })),
    );

    await transactionRepository.save(createdTransactions);
    /* exclude the arquive then  terminates this event */
    await fs.promises.unlink(filePath);

    return createdTransactions;
  }
}

export default ImportTransactionsService;
