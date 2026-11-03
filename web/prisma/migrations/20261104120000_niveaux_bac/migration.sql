-- L'institut désigne les niveaux « BAC1 » à « BAC4 » (horaires, registres).
UPDATE "Niveau" SET "code" = 'BAC' || "ordre", "libelle" = 'BAC ' || "ordre" WHERE "code" LIKE 'L%';
