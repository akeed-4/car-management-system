/** A Customer or Supplier found to share the same phone number as the party currently being
 *  created/edited -- used to prompt "link as the same real-world party?" instead of silently
 *  creating an unrelated-looking duplicate. */
export interface PotentialLinkedParty {
  id: number;
  name: string;
  phone: string;
}
