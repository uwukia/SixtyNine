/*

It all started when I read a youtube comment, in a maths video where the answer to the given problem was 24:

"Actually the answer is 96 - 69 - gcd(6,9)"

To which I thought "Nice. Wait a minute, gcd(6,9) = 3... You can write that just by doing (-6+9), no need for gcd!"
And this is where it all started.

Suppose we only have the numbers -69, 69, -6, 6, -9, 9.
And we only have the operations (a+b), (a-b), (a*b), (a/b), (a**b)

Can we write every integer in terms of those?

The quick answer is yes. All I did was notice: If I can write 1 in terms of those, I can just write 1+1+1+1+...+1
(or 1-1-1-1-...-1) for any integer N. Getting 1 was easy. I knew that X**0 = 1 for any natural number X, including 69.
And 0 = X - X. Therefore:

1 = 69**(69-69)

Now there's a much interesting question. What's the best way to do it? I mean, we can write 3 as
3 = (1 + 1) + 1 = (69**(69-69) + 69**(69-69)) + 69**(69-69)
but that requires 7 operations, when in reality I could do something like 
3 = -6 + 9
which only needs one.

In fact, there's an even better way to approach 1:
1 = 69/69 (only one operation)

Let's formalize the problem.

-69, 69, -6, 6, -9, 9 will be called atoms.
The operations will be: + , - , * , / , **

When we combine two atoms with an operation, we'll get an expression. But atoms alone can also be expressions.
69 is an atomic expression, while (69/69) is a composite (I like to call it molecular) expression.

However, there are a few rules that need to be met in order for something to be a valid expression:
(1) Must be either atomic, or an operation that takes two valid expressions.
(2) If the left expression ends on a -6 or a 6, the right term must start on a 9 or -9

The expression ((69+69)*96) is invalid because 96 is not a valid expression, since (1) requires an atom or an operation.
The expression (6+69) is invalid because (2) requires a 9 or -9 on the right, but this one has a 69

You may think an expression like (9+6) should be invalid, but I'll instead call it "incomplete".
That way, we can combine it with other incomplete expressions to form a complete expression:
(9+6) => ((9+6)*9) => 6**((9+6)*9) [this one is complete, because it starts on a 6 and ends on a 9]

To put it formally:
A complete expression is a valid expression that doesn't start with a 9 or -9, and doesn't end on a 6 or -6.

Some valid expressions are incomplete, but invalid expressions are never complete.

*/

/*
Great! So I'll have two classes: Atoms and Expressions.

Atoms will simply have a value.

Expressions will have an operation, starting atom, ending atom, completeness, left term and right term.
Starting and ending atoms are analogous to the leftmost and rightmost nodes of a binary tree.

Let's define the atom:
I'd like to store the start and end digit of an atom to make my life easier for getting starting and ending atoms of expressions.
So 6 will have start = end = 6, but -69 will have start = 6, end = 9
*/

class Atom {
  constructor (value) {
    this.evaluate = value

    const abs = Math.abs(value)
    const pow = Math.floor(Math.log10(abs))

    this.start = Math.floor(abs / (10 ** pow))
    this.end = abs % 10

    this.display = value.toString()
  }
}

const SixtyNine = new Atom(69)
const minusSixtyNine = new Atom(-69)
const Six = new Atom(6)
const minusSix = new Atom(-6)
const Nine = new Atom(9)
const minusNine = new Atom(-9)

/*
As for expressions, there's plenty of things I should be wary, such as if the constructor receives the right inputs.
Well, that's also true for atoms. But since this algorithm is only meant to be here for educational and not practical purposes,
I'll just trust myself to not try to break my own code.

So in the constructor, it'll assume the left and right terms are valid, and the operation is a valid one as well.
Not only that, we also need to make sure the left expression doesn't end the same way the right one starts. Since we don't want
two 6's or two 9's in a row. That'll be taken care outside of the constructor call.
*/

class Expression {
  constructor (leftTerm, operation, rightTerm) {
    this.left = leftTerm
    this.right = rightTerm
    this.operation = operation

    this.start = leftTerm.start
    this.end = rightTerm.end

    this.complete = this.start === 6 && this.end === 9
  }

  static get Operations() {
    return {
      '+': (left, right) => {return left + right},
      '-': (left, right) => {return left - right},
      '*': (left, right) => {return left * right},
      '/': (left, right) => {return left / right},
      '**': (left, right) => {return left ** right}
    }
  }

  get evaluate() {
    const Left = this.left.evaluate
    const Right = this.right.evaluate

    return Expression.Operations[this.operation](Left, Right)
  }

  get display() {
    const Left = this.left.display
    const Right = this.right.display

    return `(${Left} ${this.operation} ${Right})`
  }
}

// Number             Constructor                                      .evaluate  .display               .complete
const ExampleZero = new Expression(SixtyNine, '-', SixtyNine)       // 0          (69 - 69)              true
const ExampleOne = new Expression(SixtyNine, '/', SixtyNine)        // 1          (69 / 69)              true
const ExampleThree = new Expression(minusSix, '+', Nine)            // 3          (-6 + 9)               true
const ExampleNine = new Expression(ExampleThree, '*', ExampleThree) // 9          ((-6 + 9) * (-6 + 9))  true
const ExampleIncomplete = new Expression(Nine, '**', Six)           // 531441     (9 ** 6)               false

/*

Easy! Now we just have to automate the process!

What I'm looking for is pretty much brute force my way through this, so that I know, definitely what are the only numbers that can
be represented using 1, 2, 3 (maybe 4?) operations on atoms.

However, we have 6 atoms and 5 operations. Let N be the number of operations, and P the number of possibilities, we have
N   P
0   6      = 6**1 * 5**0 * 0!
1   180    = 6**2 * 5**1 * 1!
2   10800  = 6**3 * 5**2 * 2!
3   972000 = 6**4 * 5**3 * 3!
N   6**(N+1) * 5**N * N!

We need to run through more than 1 million possibilities, just to reach N=3. And do notice the exponentials and factorial. That thing
is growing fast. We need to use our brain to make it a little nicer.

For example, some operations are commutative. So instead of 36 options for sum and multiplication, we have 30. Or we could also ignore
division if the right expression evaluates to zero. But those aren't that substantial for what we need, so I won't bother for now.

The big game changer is realizing that there's no need to evaluate expressions that already have shorter representations.
For example, if we already know 1 = (69/69), there's no reason to use 69**(69-69), since that's the same but longer. We only care
about the shortest possible expressions.

That won't make a huge difference for small N, but in a "long run" such as spending hours looking for N=5,6,7... it does definitely
make a difference.

*/

const getExpressions_version1 = (N) => {

  const OperationList = Object.keys(Expression.Operations)

  const List = {
    '-6': [minusSix],
    '6': [Six],
    '-9': [minusNine],
    '9': [Nine],
    '69': [SixtyNine],
    '-69': [minusSixtyNine]
  }

  if (N === 0) return List

  for (let operations = 1; operations <= N; operations++) {
    console.log(`Getting expressions with ${operations} operations...`)
    const newList = {}

    const currentList = Object.keys(List)
    const currentAmount = currentList.length
    let counter = 0
    for (const value in List) {
      if (counter % 10 === 0) console.log(`Progress: ${(100 * (counter / currentAmount)).toPrecision(6)}%`)

      const leftExpressions = List[value]

      for (const combine in List) {
        if (combine === value) continue

        const rightExpressions = List[combine]

        leftExpressions.forEach(leftExpression => {
          rightExpressions.forEach(rightExpression => {
            OperationList.forEach(operation => {

              if (leftExpression.end !== rightExpression.start) {
                const NewExpression = new Expression(leftExpression, operation, rightExpression)
                const evaluation = NewExpression.evaluate

                if (!Number.isNaN(evaluation) && Number.isFinite(evaluation)) {
                  if (!currentList.includes(evaluation.toString())) {
                    if (!newList.hasOwnProperty(evaluation)) newList[evaluation] = []

                    if (evaluation < 1000 && evaluation >= 0) {
                      newList[evaluation].push(NewExpression)
                    }
                  }
                }
              }

            })
          })
        })
      }

      counter++
    }

    const newKeys = Object.keys(newList)
    newKeys.forEach(New => {
      if (!currentList.includes(New)) {
        List[New] = newList[New].slice()
      }
    })
  }

  console.log(`Fetching expressions...`)

  const DisplayList = {}

  for (const number in List) {
    const parse = Math.abs(parseFloat(number))
    if (parse % 1 !== 0 || parse > 10**20) continue
    const Array = List[number].filter(element => element.complete).map(element => element.display)
    if (Array.length !== 0) DisplayList[number] = Array
  }

  return DisplayList
}

/*

Alright, this algorithm has LOTS of problems. Like... lots.
I tried bodging some things, which made the code worse and worse until I decided to quit.

I don't suggest running that junk. I can't be bothered to explain the details to why. 
But it was a good start! The fact that I barely had any javascript errors is a good sign!

*/