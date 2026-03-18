/**
 * Sample Elokano programs for the IDE dropdown.
 */

export const EXAMPLES = [
  {
    name: 'Hello World',
    code: `Sarsarita pangalan dutokan-> "Lubong";
Ibaga("Kumusta, " + pangalan + "!");
`,
  },
  {
    name: 'Arithmetic & Variables',
    code: `Bilang x dutokan-> 10, y dutokan-> 5, z;
z dutokan-> x + y;
Gudua result dutokan-> ((x + y) * 2) / 3;
Bilang quotient dutokan-> y // 2;
Bilang rem dutokan-> y % 2;

Ibaga("x + y = ", "");
Ibaga(z);
Ibaga("result: ", "");
Ibaga(result);
Ibaga("quotient: ", "");
Ibaga(quotient, "\\t");
Ibaga(rem);
`,
  },
  {
    name: 'Conditionals',
    code: `Bilang edad dutokan-> 18;
Pudno estudyante dutokan-> true;

nu (edad >= 18) {
    Ibaga("Mayor de edad ka!");
    nu (estudyante == true) {
        Ibaga("Estudyante ka pay laeng.");
    }
}
sabali {
    Ibaga("Ubing ka pay.");
}
`,
  },
  {
    name: 'Full Demo (with Input)',
    code: `Sarsarita ngalan dutokan-> Ikabil("Nagan mu: ");
Sarsarita mom dutokan-> Ikabil("Nagan ni ina mu: ");
Sarsarita dad dutokan-> Ikabil("Nagan ni ama mu: ");
Sarsarita sibling dutokan-> Ikabil("Nagan ni Ate o Kuya mu: ");

Bilang x dutokan-> 10, y dutokan-> 5, z;
z dutokan-> 69;
Gudua result dutokan-> ((x + y) * 2) / 3;
Bilang quotient dutokan-> y // 2;
Bilang rem dutokan-> y % 2;

Ibaga("Nagan mo ay " + ngalan + " anak ni " + mom + " at " + dad + " kapatid ni " + sibling, "\\n");
Ibaga("result:\\t", "");
Ibaga(result);
Ibaga("quotient:\\t", "");
Ibaga(quotient, "\\t");
Ibaga(rem, "\\n");

nu (x > y) {
    Ibaga("x is greater than y, z is equal to ", "");
    Ibaga(z);
}
sabali nu (x == y) {
    Ibaga("x is equal to y");
}
sabali {
    Ibaga("x is less than or equal to y");
}
`,
  },
];

export const DEFAULT_CODE = EXAMPLES[1].code;
