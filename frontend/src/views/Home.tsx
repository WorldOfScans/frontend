import * as React from "react"
import { useMemo, useState, useEffect } from 'react';
import {
  Box,
  VStack,
  Heading,
  Switch,
  HStack,
  Text,
  Input,
  InputGroup,
  InputLeftElement,
  InputRightElement,
  IconButton,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { APP_NAME, MANGAS, SHOW_ONLY_SAVED_KEY } from "../utils/consts";
import { getFinishedManga, getSavedManga, managSaved, urlSpacesUnparser } from "../utils/utils";
import { ListItem } from "../components/ListItem";
import { AppLayout } from "../components/AppLayout";
import { FaHeart, FaRegHeart } from 'react-icons/fa';
import { setValue } from "../utils/storage";
import { CloseIcon, Search2Icon } from "@chakra-ui/icons";
import debounce from 'lodash.debounce';

export const App = () => {
    const navigate = useNavigate();
    const [savedManga, setSavedManga] = useState<string[]>([]);
    const [finishedManga, setFinishedManga] = useState<string[]>([]);
    const [showOnlySaved, setShowOnlySaved] = useState<boolean>(false);
    const [search, setSearch] = useState<string>('');

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
    };

    const debounceSearch = useMemo(() => {
        return debounce(handleSearch, 500);
    }, []);

    useEffect(() => {
        const tmp = getSavedManga();
        setSavedManga(tmp);

        const tmp2 = getFinishedManga();
        setFinishedManga(tmp2);

        const isShowOnlySaved = localStorage.getItem(SHOW_ONLY_SAVED_KEY);
        if (isShowOnlySaved) {
            setShowOnlySaved(isShowOnlySaved === "true");
        }

        return () => {
            debounceSearch.cancel();
        };
    }, [debounceSearch]);

    const goToChapterSelection = (manga: string) => {
        navigate(`/manga/${manga}/chapter`);
    };

    const changeMangaSavedStatus = (manga: string): void => {
        const key = managSaved(manga);
        if (localStorage.getItem(key)) {
            localStorage.removeItem(key);
            setSavedManga(old => old.filter((m) => m !== manga));
        } else {
            localStorage.setItem(key, "true");
            setSavedManga(old => [...old, manga]);
        }
    };

    const filterMangaList = () => {
        setShowOnlySaved(old => !old);
        setValue<boolean>(SHOW_ONLY_SAVED_KEY, !showOnlySaved);
    };

    const clearSearch = () => {
        setSearch('');
        const el = document.getElementById('search-input');
        if (el) {
            //@ts-ignore
            el.value = '';
        }
    }

    const isMangaSaved = React.useCallback((manga: string) => {
        return savedManga.includes(manga);
    }, [savedManga]);

    const isMangaFinished = React.useCallback((manga: string) => {
        return finishedManga.includes(manga);
    }, [finishedManga]);

    const mangaList = useMemo(() => {
        const beforeSearch = showOnlySaved ? Object.keys(MANGAS).filter(isMangaSaved) : Object.keys(MANGAS);
        if (!search) {
            return beforeSearch;
        }
        return beforeSearch.filter((manga) => manga.toLowerCase().includes(search.toLowerCase()));
    }, [showOnlySaved, search, isMangaSaved]);

    const boldSubstrInText = (text: string, substr: string): JSX.Element => {
        const textArray = text.split(RegExp(substr, "ig"));
        const match = text.match(RegExp(substr, "ig"));

        return (
            <span>
                {isMangaFinished(text) && '✅ '}
                {textArray.map((item, index) => (
                    <span key={`${item}-${index}`}>
                        {item}
                        {index !== textArray.length - 1 && match && (
                            <b style={{ color: 'blue' }}>{match[index]}</b>
                        )}
                    </span>
                ))}
            </span>
        );
    };

    return (
        <AppLayout>
            <Box textAlign="center" fontSize="xl" h="100%">
                <VStack w="100%" px="10px" gap="24px">
                    <Heading mt="50px">{APP_NAME}</Heading>
                    <VStack w="100%">
                        <InputGroup w="100%" px="20px">
                            <InputLeftElement ml="20px">
                                <Search2Icon color="gray" />
                            </InputLeftElement>
                            <Input id="search-input" colorScheme="teal" placeholder="Rechercher" onChange={debounceSearch} />
                            {search && <>
                                <InputRightElement>
                                    <IconButton
                                        aria-label="clear search"
                                        backgroundColor="transparent"
                                        mr="40px"
                                        icon={<CloseIcon />}
                                        _hover={{
                                            backgroundColor: 'transparent',
                                            color: 'red.500',
                                        }}
                                        onClick={clearSearch}
                                    />
                                </InputRightElement>
                            </>}
                        </InputGroup>
                        <HStack w="100%" px="30px" justify="space-between">
                            <Text fontSize="13px">Uniquement les mangas sauvegardés</Text>
                            <Switch colorScheme="teal" isChecked={showOnlySaved} onChange={filterMangaList} />
                        </HStack>
                    </VStack>
                    <VStack w="100%" overflowY="scroll" maxH="71vh">
                        {mangaList.length > 0 ? <>
                            {mangaList.map((manga, index) => (
                                <ListItem
                                    key={index}
                                    content={boldSubstrInText(urlSpacesUnparser(manga), search)}
                                    principal={() => goToChapterSelection(manga)}
                                    icon={isMangaSaved(manga) ? <FaHeart /> : <FaRegHeart />}
                                    secondary={() => changeMangaSavedStatus(manga)}
                                />
                            ))}
                        </> : <>
                            <Text><b>"{search}"</b> not found...</Text>
                        </>}
                    </VStack>
                </VStack>
            </Box>
        </AppLayout>
    );
};
