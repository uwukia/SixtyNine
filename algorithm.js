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


Okay, I went to sleep and now I've woken up with a fresh mind. Let's go through all the problems:

(1) I was grabbing every expression, joining it with every expression and spitting all operations we can perform on them. But that's not
  the expected behavior. Once we get to operations=2, it'll join atoms with single operations, but also single operations with other single
  operations. That's a total of 3 operations, not two!

(2) Even though it already had a one or two operation expression for a number, it still added longer representations, even though I only care
  about the shortest ones.

(3) One of the things my algorithm gave me for 1 is (69 + 6) ** (9 ** -69), which is accurate to 66 decimal places, but no, it is not exactly
  equal to 1. Worse than that, we all know that 0.1+0.2 !== 0.3, so I need to address that as well.

(4) I was planning to ignore that (a+b) = (b+a), but it seems more elegant to set a boolean variable that will take care of letting the algorithm
  only do the first one and not the second.

(5) For some reason it only gave me (69 + -69), but not (69 - 69) for zero. But that's because of the way I bodged things in the end. I tried
  filtering out repetition in a bad way.

(6) And more!

I'm going to create the notation p(N), which is the set of all expressions that represent the number N with the fewest amount of operations.
Example: p(0) = {(69 - 69), (69 + -69)}
When we're looking for expressions with 3 operations, we're looking for all N such that p(N) = 3, we'll call that p|3

To address problem (1), let's ask: what are all the possibilities of p|2 expressions? We can either join p|1 with p|0, or p|0 with p|1.
What about p|3? Well, we either join p|2 with p|0, p|1 with p|1, or p|0 with p|2.
for p|X, we'll have p|(X-1) with p|0, p(X-2) with p|1, ... , p|0 with p|(X-1)

In mathematical speech, what we're looking for is all the compositions of (X-1) with two parts. So with every pair of numbers that add up to X-1,
I'll only look for expressions that match those descriptions. For example, joining p|2 and p|1 is a way to make p|4. So I'll only care about
p|2 on the left, and p|1 on the right. And of course, I'll set a flag that once the left side is smaller than the outside, it'll simply ignore
plus and multiply operations (because p|1 + p|2 is the same as p|2 + p|1). So that solves problem (4)

To address problem (3), instead of working with pure javascript numbers, I'll create a class of exact numbers, that instead of storing (2/3), it'll
store the integer 2 and the integer 3. Instead of 0.1, it'll store 1 and 10. We'll only care about the decimal expansion when we want to display
the number, never when performing evaluations.

(2) and (5) are bugs that were created from badly written code, that I'm sure will fix themselves.

Let's create the Exact numbers class

*/

class Exact {
  constructor (N) {
    this.num = BigInt(N)
    this.den = 1n
    this.root = 1n
  }

  get copy() {
    const Copy = new Exact(1)
    Copy.num = this.num
    Copy.den = this.den
    Copy.root = this.root
    return Copy
  }

  static gcd(X, Y) {
    if (Y > X) {
      const temp = X
      X = Y
      Y = temp
    }
    while (true) {
        if (Y == 0) return X
        X %= Y
        if (X == 0) return Y
        Y %= X
    }
  }

  static Abs(X) {
    return X < 0n ? -X : X
  }

  get inverse() {
    const Inv = new Exact(1n)
    const Factor = this.num < 0n ? -1n : 1n

    Inv.num = Factor * this.den
    Inv.den = Exact.Abs(this.num)
    Inv.root = this.root
    return Inv
  }

  plus(that) {
    const Num = this.num * that.den + this.den * that.num
    const Den = this.den * that.den
    const GCD = Exact.gcd(Exact.Abs(Num), Den)

    const Sum = new Exact(1)
    Sum.num = Num / GCD
    Sum.den = Den / GCD

    return Sum
  }

  minus(that) {
    const Num = this.num * that.den - this.den * that.num
    const Den = this.den * that.den
    const GCD = Exact.gcd(Exact.Abs(Num), Den)

    const Sub = new Exact(1)
    Sub.num = Num / GCD
    Sub.den = Den / GCD

    return Sub
  }

  times(that) {
    const Num = this.num * that.num
    const Den = this.den * that.den
    const GCD = Exact.gcd(Exact.Abs(Num), Den)
    if (GCD === 0n) return new Exact(0)
    const Mul = new Exact(1)
    Mul.num = Num / GCD
    Mul.den = Den / GCD

    return Mul
  }

  over(that) {

    if (that.num === 0n) return { error: true }

    const Num = this.num * that.den
    const Den = this.den * that.num
    const AbsDen = Exact.Abs(Den)
    const GCD = Exact.gcd(Exact.Abs(Num), AbsDen)

    const Factor = Den < 0n ? -1n : 1n

    const Div = new Exact(1)
    Div.num = Factor * Num / GCD
    Div.den = AbsDen / GCD

    return Div
  }

  toThe(that) {
    if (that.root !== 1n) return { error: true }

    const Root = that.den

    const This = that.num < 0n ? this.inverse : this.copy
    let Res = This.copy
    
    const NumAbs = Exact.Abs(that.num)

    if (NumAbs > 100n) return { overflow: true }

    for (let i = 1n; i < NumAbs; i += 1n) {
      Res = Res.times(This)
      if (Math.abs(BigIntLog10(Res.num) - BigIntLog10(Res.den)) > 20) return { overflow: true }
    }
    const GCD = Exact.gcd(Exact.Abs(Res.num), Res.den)
    Res.num = Res.num / GCD
    Res.den = Res.den / GCD
    Res.root = Root
    return Res
  }

  get display() {
    if (this.den !== 1n || this.root !== 1n) return { float: true }
    if (this.num === 0n) return '0'

    let sign = ''

    let Int = this.num
    if (Int < 0n) {
      Int = Exact.Abs(Int)
      sign += '-'
    }

    const Digit = [0n, 1n, 2n, 3n, 4n, 5n, 6n, 7n, 8n, 9n]

    let returnString = ''
    while (Int > 0n) {
      const Mod = Int % 10n
      returnString = Digit.indexOf(Mod).toString() + returnString
      Int /= 10n
    }
  
    return sign + returnString
  }
}

const BigIntLog10 = (bigInt) => {
  let counter = 0
  while (Exact.Abs(bigInt) > 10n) {
    bigInt /= 10n
    counter++
  }

  return counter
}

/*
Exact will raise a few flags such as error, overflow or float (I only care about integers)
Now we just make a really simple function that returns pairs of compositions
*/

const compositionPair = (Num) => {
  const Pairs = []
  for (let i = Num; i >= 0; i--) {
    Pairs.push([i, Num - i])
  }

  return Pairs
}

// Now we need to recreate atoms and expressions using Exact

class Atom2 {
  constructor (value) {
    this.evaluate = new Exact(value)

    const abs = Math.abs(value)
    const pow = Math.floor(Math.log10(abs))

    this.start = Math.floor(abs / (10 ** pow))
    this.end = abs % 10

    this.display = this.evaluate.display
  }
}

class Expression2 {
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
      '+': (left, right) => {return left.plus(right)},
      '-': (left, right) => {return left.minus(right)},
      '*': (left, right) => {return left.times(right)},
      '/': (left, right) => {return left.over(right)},
      '**': (left, right) => {return left.toThe(right)}
    }
  }

  get evaluate() {
    const Left = this.left.evaluate
    const Right = this.right.evaluate

    const Eval = Expression2.Operations[this.operation](Left, Right)
    return Eval
  }

  get display() {
    const Left = this.left.display
    const Right = this.right.display

    return `(${Left} ${this.operation} ${Right})`
  }
}

const getExpression_version2 = (N) => {

  const OperationList = Object.keys(Expression2.Operations)
  const knownNumbers = ['69', '-69']

  const List = [
    {
      '-6': [new Atom2(-6)],
      '6': [new Atom2(6)],
      '-9': [new Atom2(-9)],
      '9': [new Atom2(9)],
      '69': [new Atom2(69)],
      '-69': [new Atom2(-69)]
    }
  ]

  if (N === 0) return List

  for (let operations = 1; operations <= N; operations++) {
    const newList = {float: []}
    const Compositions = compositionPair(operations - 1)

    console.log(`-> Progress: Looking for expressions with ${operations} operations...`)

    Compositions.forEach((composition, index) => {

      const LeftNumbers = List[composition[0]]
      const RightNumbers = List[composition[1]]
      const ignoreSumAndMul = composition[0] < composition[1]

      console.log(` -> Progress: ${(100 * (index / Compositions.length)).toPrecision(3)}%`)

      const Length = Object.keys(LeftNumbers).length
      let counter = 0
      for (const LeftExpressions in LeftNumbers) {
        if (operations > 3 && counter % 10 === 1) console.log(`  -> Progress: ${(100 * (counter / Length)).toPrecision(3)}%`)
        for (const RightExpressions in RightNumbers) {
          for (const Operation of OperationList) {
            if ((ignoreSumAndMul && (Operation === '+' || Operation === '*'))) break

            LeftNumbers[LeftExpressions].forEach(leftExpression => {
              RightNumbers[RightExpressions].forEach(rightExpression => {
                if (leftExpression.end !== rightExpression.start) {
                  const newExpression = new Expression2(leftExpression, Operation, rightExpression)

                  const Verify = newExpression.evaluate

                  if (!Verify.error && !Verify.overflow) {
                    const Display = Verify.display
                    if (Display.float) {
                      newList.float.push(newExpression)
                    } else {
                      if (!knownNumbers.includes(Display)) {
                        if (!newList.hasOwnProperty(Display)) newList[Display] = []
                        newList[Display].push(newExpression)
                      }
                    }
                  }
                }
              })
            })
          }
        }
        counter++
      }
    })

    const newKeys = Object.keys(newList)
    newKeys.forEach(New => {
      if (New > -10000 && New < 10000 && newList[New].filter(expression => expression.complete).length > 0) knownNumbers.push(New)
    })

    List.push(newList)
  }

  const DisplayList = []

  List.forEach(N => {
    const Obj = {}
    for (const Num in N) {
      const DisplayNum = N[Num].map(expression => expression.display)
      if (DisplayNum.length > 0) Obj[Num] = DisplayNum
    }
    DisplayList.push(Obj)
  })

  return {DisplayList, knownNumbers}
}

/*

Seems to be working well! However, still takes a long time to do N>3, so I'll have to drop the idea of getting every possible expression.

I wanted the algorithm to display every possible expression for a certain number so it could catch other alternative expressions for a number.
Examples include:

5   (6 + 9) / (-6 + 9)  | ((6 / 9) * -6) + 9
14  (6 + 9) - (69 / 69) | ((69 + 69) / 6) - 9
27  ((-6 + 9) * 6) + 9  | (-6 + 9) ** (-6 + 9)

However, there's a catch to this. Not only it gave me these alternatives, it also gave me alternatives such as:

5  (((6 / -9) * 6) + 9) | (((-6 / 9) * 6) + 9) | (((6 / 9) * -6) + 9) | (((-6 / -9) * -6) + 9) | (((6 / -9) * 6) - -9) | ...

Which are fundamentally, the same, just with some swapped signs and stuff. So if I wanted to only care about fundamentally different operations,
I'd have to get very theoretical and make my code more complicated. So with the cost of losing that information, I'll create a faster algorithm
that just cares about the first expression it ever finds for that number.

*/

const getExpression_version3 = (N) => {

  const OperationList = Object.keys(Expression2.Operations).filter(op => op !== '**')
  const knownNumbers = ['69', '-69']

  const List = [
    {
      '-6': new Atom2(-6),
      '6': new Atom2(6),
      '-9': new Atom2(-9),
      '9': new Atom2(9),
      '69': new Atom2(69),
      '-69': new Atom2(-69)
    }
  ]

  if (N === 0) return List

  for (let operations = 1; operations <= N; operations++) {

    List[operations] = {}

    const Compositions = compositionPair(operations - 1)

    console.log(`-> Progress: Looking for expressions with ${operations} operations...`)

    Compositions.forEach((composition, index) => {

      const LeftNumbers = List[composition[0]]
      const RightNumbers = List[composition[1]]
      const ignoreSumAndMul = composition[0] < composition[1]

      console.log(` -> Progress: ${(100 * (index / Compositions.length)).toPrecision(3)}%`)

      const Length = Object.keys(LeftNumbers).length
      let counter = 0
      let floatCounter = 0
      for (const LeftIndex in LeftNumbers) {
        if (operations > 4 && counter % Math.floor(Length / 50) === 0) console.log(`  -> Progress: ${(100 * (counter / Length)).toPrecision(3)}%`)
        for (const RightIndex in RightNumbers) {

          const LeftExpression = LeftNumbers[LeftIndex]
          const RightExpression = RightNumbers[RightIndex]

          for (const Operation of OperationList) {
            if ((ignoreSumAndMul && (Operation === '+' || Operation === '*'))) break

            if (LeftExpression.end !== RightExpression.start) {
              const newExpression = new Expression2(LeftExpression, Operation, RightExpression)

              const Verify = newExpression.evaluate

              if (!Verify.error && !Verify.overflow) {
                const Display = Verify.display
                if (Display.float) {
                  if (operations < N) List[operations]['float' + floatCounter.toString()] = newExpression
                } else {
                  if (!knownNumbers.includes(Display) && Display.length < 20) {
                    if (newExpression.complete || operations < N) List[operations][Display] = newExpression
                    if (newExpression.complete) knownNumbers.push(Display)
                  }
                }
              }
            }

            floatCounter++
          }
        }
        counter++
      }
    })
  }

  const DisplayList = []

  List.forEach(N => {
    const Obj = {}
    for (const Num in N) {
      const DisplayNum = N[Num].complete ? N[Num].display : false
      if (DisplayNum) Obj[Num] = DisplayNum
    }
    DisplayList.push(Obj)
  })

  return {DisplayList, knownNumbers}
}

/*

It worked perfectly, I cannot believe it.
One of the problems was the freaking ** operator, it's SO PAINFULLY SLOW. Well, I did implement it terribly.
Did I fix it by optimizing it? No, I just filtered it out on line 642 :)

BUT IT'S SO FAST NOW WOHOOOOOOOOOOO

N     Average time taken (in seconds)
1     0.002
2     0.011
3     0.076
4     0.793
5    16.217

Anyways, here are my results!

https://docs.google.com/spreadsheets/d/1Zn3Y3zqdfaV2orth5W_iYpqbRtPnPmLi9agfxrH4W6w/edit?usp=sharing

UPDATE: I made it slightly faster by noticing that, if I'm looking for 6 operations, there's no reason it should store incomplete
or non-integer expressions with 6 operations. They'll be thrown out of the result anyway. This made things a tad faster for me.

N     Average time taken (in seconds)
1     0.001
2     0.006
3     0.042
4     0.511
5    11.219
6   226.500-ish (I only tested it 3 times cause I don't have that much time)

*/