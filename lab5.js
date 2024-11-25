const express = require('express');
const { Command } = require('commander');
const fs = require('fs').promises;
const http = require('http');
const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerJSDoc = require('swagger-jsdoc');

const program = new Command();
const app = express();

program
  .requiredOption('-h, --host <host>', 'Server host')
  .requiredOption('-p, --port <port>', 'Server port')
  .requiredOption('-c, --cache <path>', 'Path to cache');

program.parse(process.argv);

const options = program.opts();
const { host, port, cache } = options;

const swaggerOptions = {
  definition: {
      openapi: '3.0.0',
      info: {
          title: 'Notes',
          version: '1.0.0',
          description: 'Note API',
      },
  },
  apis: ['lab5.js'], 
};

const openapiSpecification = swaggerJSDoc(swaggerOptions);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpecification));


app.get('/UploadForm.html', async (req, res) => {
  const filePath = path.join(__dirname, 'UploadForm.html'); 
  try {
    const htmlForm = await fs.readFile(filePath, 'utf-8');
    res.send(htmlForm);
  } catch (err) {
    res.status(500).send('Error reading HTML form');
  }
});


app.get('/notes/:name', async (req, res) => {
  const name = req.params.name;
  const filePath = path.join(cache, `${name}.txt`);
   try {
    const text = await fs.readFile(filePath, 'utf-8');
    res.send(text);
  } catch {
    res.status(404).json({ error: 'Note not found' });
  }
});


app.put('/notes/:name', async (req, res) => {
  const name = req.params.name  
  const filePath = path.join(cache, `${name}.txt`);
  if (text === undefined) {
    return res.status(400).send('Text is required');
  }
  try {
    await fs.readFile(filePath, 'utf-8'); 
    await fs.writeFile(filePath, text, 'utf-8');
    res.send('Note updated');
  } catch {
    res.status(404).json({
    error: 'Note not found' });
  }
});


app.delete('/notes/:name', async (req, res) => {
  const name = req.params.name;
  const filePath = path.join(cache, `${name}.txt`);
  try {
    await fs.unlink(filePath);
    res.send('Note deleted');
  } catch {
    res.status(404).json({ error: 'Note not found' });
  }
});


app.get('/notes', async (req, res) => {
  try {
    const files = await fs.readdir(cache); 
    const notes = [];
    for (const file of files) {
      try {
        const filePath = path.join(cache, file); 
        const text = await fs.readFile(filePath, 'utf-8'); 
        const noteName = path.basename(file, '.txt'); 
        notes.push({ name: noteName, text }); 
      } catch (readErr) {
        console.error(`Error reading file ${file}:`, readErr);
      }
    }
    res.json(notes); 
  } catch (err) {
    console.error('Error reading directory or files:', err);
    res.status(500).json({ error: 'Error reading notes' }); 
  }
});



app.post('/write', async (req, res) => {
  const { note_name, note } = req.body;
  const notePath = path.join(cache, `${note_name}.txt`);
  if (!note || !note_name) {
    return res.status(400).json({ error: 'Note name and text are required' });
  } else {
     try {
    await fs.readFile(notePath, 'utf-8'); 
    return res.status(400).json({ error: 'Note already exists' });
  } catch {
    try {
      await fs.writeFile(notePath, note, 'utf-8'); 
      return res.status(201).json(`Note created`);
    } catch (error) {
      return res.status(500).json({ error: 'Error writing note' });
    }
  }
  }
});

const server = http.createServer(app);
server.listen(port, host, () => {
  console.log(`Server is running at http://${host}:${port}`);
});



/**
 * @swagger
 * components:
 *   schemas:
 *     Note:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: Назва нотатки
 *         text:
 *           type: string
 *           description: Текст нотатки
 *       required:
 *         - name
 *         - text
 */

/**
 * @swagger
 * tags:
 *   - name: Notes
 *     description: API для роботи з нотатками
 */

/**
 * @swagger
 * /notes:
 *   get:
 *     summary: Отримати всі нотатки
 *     tags: [Notes]
 *     responses:
 *       200:
 *         description: Повертає список всіх нотаток
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Note'
 */

/**
 * @swagger
 * /notes/{name}:
 *   get:
 *     summary: Отримати конкретну нотатку
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Назва нотатки
 *     responses:
 *       200:
 *         description: Текст нотатки
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       404:
 *         description: Нотатку не знайдено
 */

/**
 * @swagger
 * /notes/{name}:
 *   put:
 *     summary: Оновити нотатку
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Назва нотатки
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Новий текст нотатки
 *     responses:
 *       200:
 *         description: Нотатку оновлено
 *       404:
 *         description: Нотатку не знайдено
 */

/**
 * @swagger
 * /notes/{name}:
 *   delete:
 *     summary: Видалити нотатку
 *     tags: [Notes]
 *     parameters:
 *       - in: path
 *         name: name
 *         schema:
 *           type: string
 *         required: true
 *         description: Назва нотатки
 *     responses:
 *       200:
 *         description: Нотатку видалено
 *       404:
 *         description: Нотатку не знайдено
 */

/**
 * @swagger
 * /write:
 *   post:
 *     summary: Створити нову нотатку
 *     tags: [Notes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               note_name:
 *                 type: string
 *                 description: Назва нотатки
 *               note:
 *                 type: string
 *                 description: Текст нотатки
 *     responses:
 *       201:
 *         description: Нотатку створено
 *       400:
 *         description: Помилка вхідних даних
 *       500:
 *         description: Помилка при записі нотатки
 */
