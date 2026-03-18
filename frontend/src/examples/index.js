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
    Sarsarita label dutokan-> "Mayor de edad ka!";
    Ibaga(label);
    nu (estudyante == true) {
        Sarsarita detail dutokan-> "Estudyante ka pay laeng.";
        Ibaga(detail);
    }
}
sabali {
    Sarsarita label dutokan-> "Ubing ka pay.";
    Ibaga(label);
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
Pudno passed dutokan-> true;

Ibaga("Nagan mo ay " + ngalan + " anak ni " + mom + " at " + dad + " kapatid ni " + sibling, "\\n");
Ibaga("result:\\t", "");
Ibaga(result);
Ibaga("quotient:\\t", "");
Ibaga(quotient, "\\t");
Ibaga(rem, "\\n");

nu (x > y) {
    Sarsarita greeting dutokan-> "Kumusta, " + ngalan + "!";
    Ibaga(greeting);
    Ibaga("x is greater than y, z is equal to ", "");
    Ibaga(z);

    nu (passed == true) {
        Sarsarita status dutokan-> "Nakapasa!";
        Ibaga(status);
    }
}
sabali nu (x == y) {
    Sarsarita msg dutokan-> "Agpada da x ken y";
    Ibaga(msg);
}
sabali {
    Sarsarita msg dutokan-> "Nababbaba ti x ngem y";
    Ibaga(msg);
}
`,
  },
];

export const DEFAULT_CODE = EXAMPLES[1].code;
